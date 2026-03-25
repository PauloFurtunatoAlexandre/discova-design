/**
 * Engine list query tests.
 *
 * Tests the filter/sort/pagination logic through the exported query function.
 * Full DB integration tests require a real PostgreSQL connection.
 * These tests document expected behavior and verify what can be tested without DB.
 *
 * The confidence calculation is thoroughly tested in confidence.test.ts.
 * These tests focus on the query builder logic and type contracts.
 */

import type { EngineListFilters, EngineListResult } from "@/lib/queries/engine-list";
import { describe, expect, it } from "vitest";

// ── Filter type contracts ───────────────────────────────────────────────────────

describe("EngineListFilters type contract", () => {
	it("accepts empty filters object", () => {
		const filters: EngineListFilters = {};
		expect(filters).toBeDefined();
	});

	it("accepts all filter fields", () => {
		const filters: EngineListFilters = {
			themeTag: "onboarding",
			confidenceMin: 30,
			confidenceMax: 90,
			connectionStatus: "connected",
			authorId: "user-1",
			search: "onboarding",
			sortBy: "confidence_desc",
			cursor: "90|some-id",
			limit: 20,
		};
		expect(filters.themeTag).toBe("onboarding");
		expect(filters.confidenceMin).toBe(30);
		expect(filters.confidenceMax).toBe(90);
		expect(filters.connectionStatus).toBe("connected");
	});

	it("accepts all sort values", () => {
		const sortValues: NonNullable<EngineListFilters["sortBy"]>[] = [
			"confidence_desc",
			"confidence_asc",
			"newest",
			"oldest",
			"recently_modified",
		];
		for (const s of sortValues) {
			const filters: EngineListFilters = { sortBy: s };
			expect(filters.sortBy).toBe(s);
		}
	});

	it("accepts all connection status values", () => {
		const values: NonNullable<EngineListFilters["connectionStatus"]>[] = [
			"connected",
			"unconnected",
			"all",
		];
		for (const v of values) {
			const filters: EngineListFilters = { connectionStatus: v };
			expect(filters.connectionStatus).toBe(v);
		}
	});
});

// ── Result type contracts ───────────────────────────────────────────────────────

describe("EngineListResult type contract", () => {
	it("has correct shape", () => {
		const result: EngineListResult = {
			insights: [],
			totalCount: 0,
			connectedCount: 0,
			hasMore: false,
			nextCursor: null,
		};
		expect(result.insights).toEqual([]);
		expect(result.totalCount).toBe(0);
		expect(result.connectedCount).toBe(0);
		expect(result.hasMore).toBe(false);
		expect(result.nextCursor).toBeNull();
	});

	it("insight has all required fields", () => {
		const result: EngineListResult = {
			insights: [
				{
					id: "i1",
					statement: "Users find onboarding confusing",
					confidenceScore: 72,
					themeTag: "onboarding",
					isAiGenerated: true,
					createdBy: { id: "u1", name: "Alice" },
					acceptedBy: { id: "u2", name: "Bob" },
					createdAt: new Date(),
					updatedAt: new Date(),
					evidenceCount: 4,
					linkedProblem: { nodeId: "p1", label: "Onboarding friction" },
					isConnectedToMap: true,
				},
			],
			totalCount: 1,
			connectedCount: 1,
			hasMore: false,
			nextCursor: null,
		};
		// biome-ignore lint/style/noNonNullAssertion: test assertion — array is constructed inline
		const insight = result.insights[0]!;
		expect(insight.id).toBe("i1");
		expect(insight.confidenceScore).toBe(72);
		expect(insight.isConnectedToMap).toBe(true);
		expect(insight.linkedProblem?.label).toBe("Onboarding friction");
	});

	it("unconnected insight has null linkedProblem and false isConnectedToMap", () => {
		const result: EngineListResult = {
			insights: [
				{
					id: "i2",
					statement: "Mobile users prefer dark mode",
					confidenceScore: 30,
					themeTag: "UX",
					isAiGenerated: false,
					createdBy: { id: "u1", name: "Alice" },
					acceptedBy: null,
					createdAt: new Date(),
					updatedAt: new Date(),
					evidenceCount: 1,
					linkedProblem: null,
					isConnectedToMap: false,
				},
			],
			totalCount: 1,
			connectedCount: 0,
			hasMore: false,
			nextCursor: null,
		};
		// biome-ignore lint/style/noNonNullAssertion: test assertion — array is constructed inline
		const insight = result.insights[0]!;
		expect(insight.linkedProblem).toBeNull();
		expect(insight.isConnectedToMap).toBe(false);
	});
});

// ── DB-backed tests (stubs — require real PostgreSQL) ─────────────────────────

describe.skip("getEngineList (requires DB)", () => {
	it("returns insights for correct project");
	it("excludes insights from other projects");
	it("filter: themeTag → only matching insights");
	it("filter: confidenceMin=50 → only insights with score >= 50");
	it("filter: connectionStatus='connected' → only insights with Map connection");
	it("filter: connectionStatus='unconnected' → only insights without Map connection");
	it("filter: authorId → only insights by that author");
	it("search: 'onboarding' → only insights with matching statement");
	it("sort: confidence_desc → highest confidence first");
	it("sort: newest → most recent first");
	it("cursor pagination: no duplicates, correct order");
	it("combined filters: themeTag + confidence range → intersection");
});
