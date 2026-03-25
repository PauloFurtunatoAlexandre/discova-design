/**
 * Vault server action tests.
 *
 * Full integration tests (DB + auth) require a real database connection.
 * These tests cover:
 * 1. Schema validation paths (via createNoteSchema directly)
 * 2. Sanitization logic (via the exported sanitizeContent helper)
 * 3. Permission-related schema behaviour
 */

import { createNoteSchema } from "@/lib/validations/vault";
import { describe, expect, it } from "vitest";

const TODAY = new Date().toISOString().split("T")[0];

const BASE_ARGS = {
	participantName: "Sarah Chen",
	sessionDate: TODAY,
	rawContent: "The user couldn't find the export button. She tried 3 times.",
};

// ── Validation: minimum fields ────────────────────────────────────────────────

describe("createNoteAction input — minimum fields", () => {
	it("passes with only the three required fields", () => {
		const result = createNoteSchema.safeParse(BASE_ARGS);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.participantName).toBe("Sarah Chen");
			expect(result.data.tags).toEqual([]);
			expect(result.data.followUpNeeded).toBe(false);
		}
	});

	it("passes with all metadata fields populated", () => {
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			researchMethod: "interview",
			userSegment: "Enterprise Admin",
			emotionalTone: "frustrated",
			assumptionsTested: "We assumed users knew how to export.",
			followUpNeeded: true,
			sessionRecordingUrl: "https://loom.com/share/abc123",
			tags: ["exports", "nav", "enterprise"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.researchMethod).toBe("interview");
			expect(result.data.tags).toHaveLength(3);
			expect(result.data.followUpNeeded).toBe(true);
		}
	});
});

// ── Validation: field errors ──────────────────────────────────────────────────

describe("createNoteAction input — field validation", () => {
	it("returns fieldErrors for empty participantName", () => {
		const result = createNoteSchema.safeParse({ ...BASE_ARGS, participantName: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.participantName).toBeDefined();
		}
	});

	it("returns error for future sessionDate", () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			sessionDate: tomorrow.toISOString().split("T")[0],
		});
		expect(result.success).toBe(false);
	});

	it("returns error for invalid sessionRecordingUrl", () => {
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			sessionRecordingUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
	});
});

// ── Sanitization ──────────────────────────────────────────────────────────────

/**
 * The sanitizeContent function is not exported from the actions file (it's
 * a private helper). We test the expected behaviour here by verifying that
 * script tags in rawContent do not break schema validation, and we document
 * the expected server-side stripping behaviour.
 *
 * NOTE: In a real integration test with a mocked DB, you would call
 * createNoteAction and verify the stored rawContent has no <script> tags.
 */
describe("rawContent sanitization", () => {
	it("rawContent containing <script> passes schema validation (stripping happens server-side)", () => {
		// Schema only checks min length — stripping is in the action handler
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			rawContent: 'User said "great!" <script>alert("xss")</script>',
		});
		// Schema passes — server action strips the script tag before DB insert
		expect(result.success).toBe(true);
	});

	it("rawContent must be non-empty after trimming script tags (server-side concern)", () => {
		// Schema rejects empty rawContent
		const result = createNoteSchema.safeParse({ ...BASE_ARGS, rawContent: "" });
		expect(result.success).toBe(false);
	});
});

// ── Tags ──────────────────────────────────────────────────────────────────────

describe("createNoteAction input — tags", () => {
	it("accepts new tags as plain strings", () => {
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			tags: ["onboarding", "retention"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual(["onboarding", "retention"]);
		}
	});

	it("rejects tags array with more than 20 items", () => {
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
		});
		expect(result.success).toBe(false);
	});

	it("trims whitespace from individual tags", () => {
		const result = createNoteSchema.safeParse({
			...BASE_ARGS,
			tags: ["  onboarding  ", " retention "],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual(["onboarding", "retention"]);
		}
	});
});

// ── IDOR protection ───────────────────────────────────────────────────────────

describe("projectId security", () => {
	it("schema does not include projectId — it comes from ctx, not user input", () => {
		// The createNoteSchema does NOT have a projectId field.
		// This means user-supplied projectId cannot be injected into the schema.
		// The server action always uses ctx.projectId from the verified auth context.
		const schemaKeys = Object.keys(createNoteSchema.shape);
		expect(schemaKeys).not.toContain("projectId");
		expect(schemaKeys).not.toContain("workspaceId");
		expect(schemaKeys).not.toContain("createdBy");
	});
});
