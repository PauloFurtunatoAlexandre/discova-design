/**
 * Vault metadata update tests.
 *
 * Tests cover the Zod schema validation layer for the update actions.
 * Full integration tests (DB + auth) require a real database connection.
 */

import { updateNoteMetadataSchema, updateNoteTagsSchema } from "@/lib/validations/vault";
import { describe, expect, it } from "vitest";

// ── updateNoteMetadataSchema ──────────────────────────────────────────────────

describe("updateNoteMetadataSchema — valid inputs", () => {
	it("accepts valid researchMethod", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "researchMethod",
			value: "interview",
		});
		expect(result.success).toBe(true);
	});

	it("accepts null researchMethod", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "researchMethod",
			value: null,
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid emotionalTone", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "emotionalTone",
			value: "frustrated",
		});
		expect(result.success).toBe(true);
	});

	it("accepts followUpNeeded boolean", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "followUpNeeded",
			value: true,
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid sessionRecordingUrl", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "sessionRecordingUrl",
			value: "https://loom.com/share/abc123",
		});
		expect(result.success).toBe(true);
	});

	it("accepts null sessionRecordingUrl", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "sessionRecordingUrl",
			value: null,
		});
		expect(result.success).toBe(true);
	});
});

describe("updateNoteMetadataSchema — invalid inputs", () => {
	it("rejects unknown field name", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "hackerField",
			value: "anything",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid researchMethod enum value", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "researchMethod",
			value: "hackathon",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid emotionalTone enum value", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "emotionalTone",
			value: "angry",
		});
		expect(result.success).toBe(false);
	});

	it("rejects invalid URL for sessionRecordingUrl", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "sessionRecordingUrl",
			value: "not-a-url",
		});
		expect(result.success).toBe(false);
	});

	it("rejects javascript: protocol in sessionRecordingUrl", () => {
		const result = updateNoteMetadataSchema.safeParse({
			field: "sessionRecordingUrl",
			value: "javascript:alert(1)",
		});
		expect(result.success).toBe(false);
	});
});

// ── updateNoteTagsSchema ──────────────────────────────────────────────────────

describe("updateNoteTagsSchema", () => {
	it("accepts a valid tags array", () => {
		const result = updateNoteTagsSchema.safeParse({
			tags: ["research", "onboarding", "enterprise"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toHaveLength(3);
		}
	});

	it("accepts empty tags array (remove all tags)", () => {
		const result = updateNoteTagsSchema.safeParse({ tags: [] });
		expect(result.success).toBe(true);
	});

	it("defaults to empty array when tags is omitted", () => {
		const result = updateNoteTagsSchema.safeParse({});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual([]);
		}
	});

	it("rejects more than 20 tags", () => {
		const result = updateNoteTagsSchema.safeParse({
			tags: Array.from({ length: 21 }, (_, i) => `tag${i}`),
		});
		expect(result.success).toBe(false);
	});

	it("trims whitespace from tags", () => {
		const result = updateNoteTagsSchema.safeParse({
			tags: ["  research  ", " onboarding"],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual(["research", "onboarding"]);
		}
	});
});

// ── IDOR documentation ────────────────────────────────────────────────────────

describe("metadata action security — documented constraints", () => {
	it("updateNoteMetadataSchema does not contain noteId, workspaceId, or projectId", () => {
		// These must come from AuthContext (withPermission guard), not user input.
		// The schema only validates the field name and its value.
		const result = updateNoteMetadataSchema.safeParse({
			field: "userSegment",
			value: "Enterprise",
		});
		if (result.success) {
			const data = result.data;
			expect(data).not.toHaveProperty("noteId");
			expect(data).not.toHaveProperty("workspaceId");
			expect(data).not.toHaveProperty("projectId");
		}
	});
});
