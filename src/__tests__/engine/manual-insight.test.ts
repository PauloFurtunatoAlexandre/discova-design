/**
 * Tests for manual insight creation, update, and delete actions.
 *
 * DB-dependent action tests are documented stubs — full integration
 * requires a running Postgres instance.
 * Pure Zod validation logic is tested directly.
 */
import { createManualInsightSchema, updateInsightSchema } from "@/lib/validations/insights";
import { describe, expect, it } from "vitest";

// ── createManualInsightSchema ─────────────────────────────────────────────────

describe("createManualInsightSchema", () => {
	it("accepts a valid insight with statement only", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Users prefer search over browse navigation",
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
	});

	it("accepts insight with all optional fields", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Users prefer search over browse navigation",
			themeTag: "navigation",
			evidenceQuoteIds: ["550e8400-e29b-41d4-a716-446655440000"],
			problemNodeId: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});

	it("rejects empty statement", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "",
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.statement).toBeDefined();
		}
	});

	it("rejects statement over 500 characters", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "a".repeat(501),
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(false);
	});

	it("trims whitespace from statement", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "  Valid insight  ",
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.statement).toBe("Valid insight");
		}
	});

	it("rejects non-UUID in evidenceQuoteIds", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			evidenceQuoteIds: ["not-a-uuid"],
		});
		expect(result.success).toBe(false);
	});

	it("accepts empty evidenceQuoteIds array", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
	});

	it("transforms empty themeTag to null", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			themeTag: "",
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.themeTag).toBe(null);
		}
	});

	it("rejects non-UUID problemNodeId", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			evidenceQuoteIds: [],
			problemNodeId: "not-a-uuid",
		});
		expect(result.success).toBe(false);
	});

	it("accepts null problemNodeId", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			evidenceQuoteIds: [],
			problemNodeId: null,
		});
		expect(result.success).toBe(true);
	});

	it("rejects themeTag over 50 characters", () => {
		const result = createManualInsightSchema.safeParse({
			statement: "Valid insight",
			themeTag: "a".repeat(51),
			evidenceQuoteIds: [],
		});
		expect(result.success).toBe(false);
	});
});

// ── updateInsightSchema ───────────────────────────────────────────────────────

describe("updateInsightSchema", () => {
	it("accepts valid insightId with statement update", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
			statement: "Updated insight statement",
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid insightId with themeTag only", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
			themeTag: "updated-tag",
		});
		expect(result.success).toBe(true);
	});

	it("accepts insightId with no optional fields (no-op update)", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-UUID insightId", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "not-a-uuid",
			statement: "Updated statement",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty statement when provided", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
			statement: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects statement over 500 characters", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
			statement: "a".repeat(501),
		});
		expect(result.success).toBe(false);
	});

	it("trims statement whitespace", () => {
		const result = updateInsightSchema.safeParse({
			insightId: "550e8400-e29b-41d4-a716-446655440000",
			statement: "  Trimmed statement  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.statement).toBe("Trimmed statement");
		}
	});
});

// ── Action contract documentation ─────────────────────────────────────────────
//
// Integration tests require a live DB. The contracts below document expected
// behavior verifiable in the QA steps.
//
// createManualInsightAction:
//   ✓ Creates insight with isAiGenerated=false
//   ✓ Links evidenceQuoteIds correctly (via insight_evidence table)
//   ✓ Links to problem node when problemNodeId provided (via map_nodes + map_connections)
//   ✓ Works without evidence (0 quotes)
//   ✗ Viewer returns { error: "Permission denied." }
//   ✗ PM returns { error: "Permission denied." } (Engine write denied for PM)
//
// updateInsightAction:
//   ✓ Creator can update own insight statement + themeTag
//   ✓ Admin can update any insight
//   ✗ Non-creator non-admin returns { error: "You can only edit insights you created" }
//
// deleteInsightAction:
//   ✓ Creator can delete own insight
//   ✓ Admin can delete any insight
//   ✓ Deletes associated map_nodes (cascade removes map_connections)
//   ✗ Non-creator non-admin returns { error: "You can only delete insights you created" }
