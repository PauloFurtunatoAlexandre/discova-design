import { CANVAS_PADDING, COLUMN_X, NODE_GAP_Y } from "@/lib/map/constants";
import { calculateLayout, getContentBounds } from "@/lib/map/layout";
import type { MapNodeData } from "@/lib/map/types";
import { describe, expect, it } from "vitest";

function makeNode(
	overrides: Partial<MapNodeData> & { id: string; type: MapNodeData["type"] },
): MapNodeData {
	return {
		label: "Test",
		description: null,
		insightId: null,
		positionX: 0,
		positionY: 0,
		isCollapsed: false,
		createdBy: "u1",
		baseState: "unconnected",
		connectionCount: 0,
		...overrides,
	};
}

describe("calculateLayout", () => {
	it("positions insight nodes at x=0", () => {
		const nodes = [makeNode({ id: "i1", type: "insight" })];
		const result = calculateLayout(nodes);
		expect(result[0]?.positionX).toBe(COLUMN_X.insight);
	});

	it("positions problem nodes at x=400", () => {
		const nodes = [makeNode({ id: "p1", type: "problem" })];
		const result = calculateLayout(nodes);
		expect(result[0]?.positionX).toBe(COLUMN_X.problem);
	});

	it("positions solution nodes at x=800", () => {
		const nodes = [makeNode({ id: "s1", type: "solution" })];
		const result = calculateLayout(nodes);
		expect(result[0]?.positionX).toBe(COLUMN_X.solution);
	});

	it("stacks nodes vertically with gap", () => {
		const nodes = [
			makeNode({ id: "i1", type: "insight" }),
			makeNode({ id: "i2", type: "insight" }),
			makeNode({ id: "i3", type: "insight" }),
		];
		const result = calculateLayout(nodes);
		const estimatedHeight = 80;

		expect(result[0]?.positionY).toBe(CANVAS_PADDING);
		expect(result[1]?.positionY).toBe(CANVAS_PADDING + estimatedHeight + NODE_GAP_Y);
		expect(result[2]?.positionY).toBe(CANVAS_PADDING + (estimatedHeight + NODE_GAP_Y) * 2);
	});

	it("preserves nodes with existing non-zero positions", () => {
		const nodes = [makeNode({ id: "i1", type: "insight", positionX: 150, positionY: 200 })];
		const result = calculateLayout(nodes);
		expect(result[0]?.positionX).toBe(150);
		expect(result[0]?.positionY).toBe(200);
	});

	it("returns empty array for empty input", () => {
		expect(calculateLayout([])).toEqual([]);
	});
});

describe("getContentBounds", () => {
	it("returns correct bounding box", () => {
		const nodes = [
			makeNode({ id: "i1", type: "insight", positionX: 100, positionY: 50 }),
			makeNode({ id: "p1", type: "problem", positionX: 500, positionY: 300 }),
		];
		const bounds = getContentBounds(nodes);

		expect(bounds.minX).toBe(100 - CANVAS_PADDING);
		expect(bounds.minY).toBe(50 - CANVAS_PADDING);
		expect(bounds.maxX).toBeGreaterThan(500);
		expect(bounds.maxY).toBeGreaterThan(300);
		expect(bounds.width).toBe(bounds.maxX - bounds.minX);
		expect(bounds.height).toBe(bounds.maxY - bounds.minY);
	});

	it("returns default bounds for empty array", () => {
		const bounds = getContentBounds([]);
		expect(bounds.width).toBe(800);
		expect(bounds.height).toBe(600);
	});
});
