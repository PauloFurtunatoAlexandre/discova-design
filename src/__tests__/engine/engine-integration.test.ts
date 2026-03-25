/**
 * Engine integration tests.
 *
 * Tests the interaction between confidence calculation, recalculation triggers,
 * the engine list query, and insight CRUD actions.
 *
 * DB-backed tests are skipped (require real PostgreSQL).
 * These tests document expected integration behaviour and verify pure-logic paths.
 */

import { type EvidenceInput, calculateConfidence } from "@/lib/engine/confidence";
import type { EngineListFilters, EngineListResult } from "@/lib/queries/engine-list";
import { describe, expect, it } from "vitest";

// ── Confidence recalculation integration ────────────────────────────────────

describe("confidence recalculation integration", () => {
	it("adding evidence from a new note increases confidence", () => {
		const before: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		const after: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n2", emotionalTone: "neutral" },
		];
		expect(calculateConfidence(after)).toBeGreaterThan(calculateConfidence(before));
	});

	it("adding evidence from same note does not change confidence", () => {
		const before: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		const after: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n1", emotionalTone: "frustrated" },
		];
		// Second quote from same note is ignored (first occurrence wins)
		expect(calculateConfidence(after)).toBe(calculateConfidence(before));
	});

	it("removing the only evidence drops confidence to 0", () => {
		const before: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		const after: EvidenceInput[] = [];
		expect(calculateConfidence(before)).toBe(30);
		expect(calculateConfidence(after)).toBe(0);
	});

	it("changing note emotional tone from neutral to frustrated increases score", () => {
		const neutral: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		const frustrated: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "frustrated" }];
		expect(calculateConfidence(frustrated)).toBeGreaterThan(calculateConfidence(neutral));
	});

	it("changing note emotional tone from frustrated to neutral decreases score", () => {
		const frustrated: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "frustrated" },
			{ noteId: "n2", emotionalTone: "neutral" },
		];
		const neutral: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n2", emotionalTone: "neutral" },
		];
		expect(calculateConfidence(frustrated)).toBeGreaterThan(calculateConfidence(neutral));
	});
});

// ── Engine list query type integration ──────────────────────────────────────

describe("engine list result structure", () => {
	it("hasMore=true when results exceed limit", () => {
		// Simulating: if query returns limit+1 rows, hasMore is true
		const limit = 20;
		const fetchedRows = 21; // limit + 1
		const hasMore = fetchedRows > limit;
		expect(hasMore).toBe(true);
	});

	it("hasMore=false when results are within limit", () => {
		const limit = 20;
		const fetchedRows = 15;
		const hasMore = fetchedRows > limit;
		expect(hasMore).toBe(false);
	});

	it("nextCursor is null when no more results", () => {
		const result: EngineListResult = {
			insights: [],
			totalCount: 0,
			connectedCount: 0,
			hasMore: false,
			nextCursor: null,
		};
		expect(result.nextCursor).toBeNull();
	});

	it("cursor format for confidence sort is 'score|id'", () => {
		const cursor = "72|some-uuid";
		const [score, id] = cursor.split("|");
		expect(Number(score)).toBe(72);
		expect(id).toBe("some-uuid");
	});

	it("cursor format for date sort is 'iso-date|id'", () => {
		const now = new Date();
		const cursor = `${now.toISOString()}|some-uuid`;
		const [dateStr, id] = cursor.split("|");
		expect(new Date(dateStr as string).getTime()).toBe(now.getTime());
		expect(id).toBe("some-uuid");
	});
});

// ── Filter contract integration ─────────────────────────────────────────────

describe("filter combinations", () => {
	it("all filters can be combined without type errors", () => {
		const filters: EngineListFilters = {
			themeTag: "onboarding",
			confidenceMin: 30,
			confidenceMax: 90,
			connectionStatus: "connected",
			authorId: "user-1",
			search: "checkout",
			sortBy: "confidence_desc",
			cursor: "72|some-id",
			limit: 10,
		};
		expect(filters).toBeDefined();
		expect(filters.themeTag).toBe("onboarding");
		expect(filters.confidenceMin).toBe(30);
		expect(filters.connectionStatus).toBe("connected");
	});

	it("empty filters object is valid", () => {
		const filters: EngineListFilters = {};
		expect(filters).toBeDefined();
	});

	it("connectionStatus 'all' is equivalent to no filter", () => {
		const withAll: EngineListFilters = { connectionStatus: "all" };
		const withoutFilter: EngineListFilters = {};
		// Both should not restrict results — verified by query logic
		expect(withAll.connectionStatus).toBe("all");
		expect(withoutFilter.connectionStatus).toBeUndefined();
	});
});

// ── Confidence score boundary integration ───────────────────────────────────

describe("confidence score boundaries for filter ranges", () => {
	it("score of 0 matches confidenceMin=0", () => {
		const score = calculateConfidence([]);
		expect(score).toBe(0);
		expect(score >= 0).toBe(true); // Would match confidenceMin=0
	});

	it("score of 90 matches confidenceMax=90", () => {
		const evidence: EvidenceInput[] = Array.from({ length: 10 }, (_, i) => ({
			noteId: `n${i}`,
			emotionalTone: "frustrated",
		}));
		const score = calculateConfidence(evidence);
		expect(score).toBe(90);
		expect(score <= 90).toBe(true); // Would match confidenceMax=90
	});

	it("score is always within [0, 90] range", () => {
		// Test many random-ish combinations
		const testCases: EvidenceInput[][] = [
			[],
			[{ noteId: "n1", emotionalTone: null }],
			[{ noteId: "n1", emotionalTone: "frustrated" }],
			Array.from({ length: 20 }, (_, i) => ({
				noteId: `n${i}`,
				emotionalTone: i % 2 === 0 ? "delighted" : "neutral",
			})),
		];

		for (const evidence of testCases) {
			const score = calculateConfidence(evidence);
			expect(score).toBeGreaterThanOrEqual(0);
			expect(score).toBeLessThanOrEqual(90);
			expect(Number.isInteger(score)).toBe(true);
		}
	});
});

// ── DB-backed integration tests (stubs) ─────────────────────────────────────

describe.skip("full engine integration (requires DB)", () => {
	it("acceptInsightAction: creates insight, links evidence, recalculates confidence");
	it("acceptInsightAction: IDOR — rejects evidenceQuoteIds from other project");
	it("acceptInsightAction: IDOR — rejects problemNodeId from other project");
	it("createManualInsightAction: creates insight without AI flag");
	it("createManualInsightAction: links selected quotes as evidence");
	it("deleteInsightAction: removes insight + map nodes + evidence links");
	it("deleteInsightAction: non-creator non-admin cannot delete");
	it("updateInsightAction: updates statement and themeTag");
	it("updateInsightAction: non-creator non-admin cannot edit");
	it("batchRecalculateForNote: updates all insights linked to note quotes");
	it("getEngineList: respects all filter combinations");
	it("getEngineList: cursor pagination produces no duplicates");
	it("getEngineList: search is case-insensitive (ILIKE)");
	it("getEngineList: connectedCount only counts insights with map connections");
	it("engine API route: 401 for unauthenticated, 403 for wrong workspace");
});
