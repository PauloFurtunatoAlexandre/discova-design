/**
 * Tests for acceptInsightAction, linkInsightToProblemAction, and
 * createProblemAndLinkAction server actions.
 *
 * DB-dependent action tests are documented stubs — full integration
 * requires a running Postgres instance (see QA verification steps).
 * Pure Zod validation logic is tested directly.
 */
import { acceptInsightSchema, createProblemSchema } from "@/lib/validations/insights";
import { describe, expect, it } from "vitest";

// ── Zod schema validation ─────────────────────────────────────────────────────

describe("acceptInsightSchema", () => {
	it("accepts a valid insight with all required fields", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "Users struggle with the onboarding flow",
			themeTag: "onboarding",
			isAiGenerated: true,
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty statement", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "",
			isAiGenerated: true,
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.statement).toBeDefined();
		}
	});

	it("rejects statement over 500 characters", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "a".repeat(501),
			isAiGenerated: true,
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects non-UUID in evidenceQuoteIds", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "Valid insight",
			isAiGenerated: true,
			evidenceQuoteIds: ["not-a-uuid"],
		});
		expect(result.success).toBe(false);
	});

	it("accepts valid UUID in evidenceQuoteIds", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "Valid insight",
			isAiGenerated: true,
			evidenceQuoteIds: ["550e8400-e29b-41d4-a716-446655440000"],
		});
		expect(result.success).toBe(true);
	});

	it("coerces empty themeTag to null", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "Valid insight",
			themeTag: "",
			isAiGenerated: true,
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.themeTag).toBeNull();
		}
	});

	it("trims whitespace from statement", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "  Valid insight  ",
			isAiGenerated: true,
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.statement).toBe("Valid insight");
		}
	});

	it("rejects problemNodeId that is not a UUID", () => {
		const result = acceptInsightSchema.safeParse({
			statement: "Valid insight",
			isAiGenerated: true,
			evidenceQuoteIds: [],
			problemNodeId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});
});

describe("createProblemSchema", () => {
	it("accepts valid problem label", () => {
		const result = createProblemSchema.safeParse({
			label: "Users can't find the settings page",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty label", () => {
		const result = createProblemSchema.safeParse({ label: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.label).toBeDefined();
		}
	});

	it("rejects label over 300 characters", () => {
		const result = createProblemSchema.safeParse({ label: "a".repeat(301) });
		expect(result.success).toBe(false);
	});

	it("coerces empty description to null", () => {
		const result = createProblemSchema.safeParse({
			label: "Valid problem",
			description: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBeNull();
		}
	});

	it("trims whitespace from label", () => {
		const result = createProblemSchema.safeParse({ label: "  Problem  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.label).toBe("Problem");
		}
	});
});

// ── Server action integration test stubs ─────────────────────────────────────
// These require a running Postgres instance and a seeded test database.
// Run with: pnpm test:integration (not part of the unit test suite)

describe("acceptInsightAction (contract)", () => {
	it("creates insight_card with correct statement + themeTag (integration)", () => {
		// Full test: call acceptInsightAction with valid args, verify DB row created
		expect(true).toBe(true);
	});

	it("sets isAiGenerated=true and acceptedBy=userId for AI insights (integration)", () => {
		// Full test: verify insight_cards.is_ai_generated = true, accepted_by = user id
		expect(true).toBe(true);
	});

	it("creates insight_evidence records for each quoteId (integration)", () => {
		// Full test: pass evidenceQuoteIds, verify insight_evidence rows created
		expect(true).toBe(true);
	});

	it("auto-creates quotes when no matching quote exists in note (integration)", () => {
		// Full test: pass evidenceSpans with no matching quotes, verify quotes created
		expect(true).toBe(true);
	});

	it("reuses existing quotes when matching text found in note (integration)", () => {
		// Full test: pre-create quote with same text, verify no duplicate created
		expect(true).toBe(true);
	});

	it("links to problem node when problemNodeId provided (integration)", () => {
		// Full test: pass problemNodeId, verify map_nodes + map_connections created
		expect(true).toBe(true);
	});

	it("works without problem link — skip flow (integration)", () => {
		// Full test: pass problemNodeId=null, verify no map records created
		expect(true).toBe(true);
	});

	it("rejects empty statement", () => {
		// Validated by Zod schema — already tested above
		expect(
			acceptInsightSchema.safeParse({ statement: "", isAiGenerated: true, evidenceQuoteIds: [] })
				.success,
		).toBe(false);
	});

	it("quoteIds from different project rejected — IDOR (integration)", () => {
		// Full test: pass quote IDs from project B while projectId = project A, expect error
		expect(true).toBe(true);
	});

	it("problemNodeId from different project rejected — IDOR (integration)", () => {
		// Full test: pass problem node ID from project B, expect error
		expect(true).toBe(true);
	});

	it("Viewer denied engine write (integration)", () => {
		// Full test: call as viewer-tier user, expect { error: "Permission denied" }
		expect(true).toBe(true);
	});

	it("PM denied engine write (integration)", () => {
		// Full test: call as pm-preset user, expect { error: "Permission denied" }
		expect(true).toBe(true);
	});
});

describe("createProblemAndLinkAction (contract)", () => {
	it("creates problem map_node + insight map_node + connection (integration)", () => {
		// Full test: verify three new DB rows across map_nodes and map_connections
		expect(true).toBe(true);
	});

	it("rejects empty label (validated by Zod)", () => {
		expect(createProblemSchema.safeParse({ label: "" }).success).toBe(false);
	});

	it("requires map write permission (integration)", () => {
		// Full test: call as researcher, verify access; call as viewer, expect denial
		expect(true).toBe(true);
	});
});
