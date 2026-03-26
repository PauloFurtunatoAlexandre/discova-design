import { CANVAS_PADDING, COLUMN_X, NODE_GAP_Y, NODE_WIDTH } from "./constants";
import type { MapNodeData } from "./types";

/**
 * Calculate positions for nodes that don't have user-set positions (positionX/Y = 0).
 * Nodes with existing positions (from drag) are preserved.
 *
 * Layout: 3 columns — Insights (left), Problems (center), Solutions (right)
 * Within each column: stack vertically with NODE_GAP_Y gap
 */
export function calculateLayout(nodes: MapNodeData[]): MapNodeData[] {
	const insights = nodes.filter((n) => n.type === "insight");
	const problems = nodes.filter((n) => n.type === "problem");
	const solutions = nodes.filter((n) => n.type === "solution");

	return [
		...layoutColumn(insights, COLUMN_X.insight),
		...layoutColumn(problems, COLUMN_X.problem),
		...layoutColumn(solutions, COLUMN_X.solution),
	];
}

function layoutColumn(nodes: MapNodeData[], columnX: number): MapNodeData[] {
	let currentY = CANVAS_PADDING;

	return nodes.map((node) => {
		if (node.positionX !== 0 || node.positionY !== 0) {
			return node;
		}

		const positioned = {
			...node,
			positionX: columnX,
			positionY: currentY,
		};

		const estimatedHeight = 80;
		currentY += estimatedHeight + NODE_GAP_Y;

		return positioned;
	});
}

/**
 * Get the bounding box of all nodes (for fit-to-view).
 */
export function getContentBounds(nodes: MapNodeData[]): {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
	width: number;
	height: number;
} {
	if (nodes.length === 0) {
		return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
	}

	const xs = nodes.map((n) => n.positionX);
	const ys = nodes.map((n) => n.positionY);

	const minX = Math.min(...xs) - CANVAS_PADDING;
	const minY = Math.min(...ys) - CANVAS_PADDING;
	const maxX = Math.max(...xs) + NODE_WIDTH + CANVAS_PADDING;
	const maxY = Math.max(...ys) + 100 + CANVAS_PADDING;

	return {
		minX,
		minY,
		maxX,
		maxY,
		width: maxX - minX,
		height: maxY - minY,
	};
}
