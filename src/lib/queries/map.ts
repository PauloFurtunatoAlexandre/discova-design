import { db } from "@/lib/db";
import { insightCards, mapConnections, mapNodes } from "@/lib/db/schema";
import type { BaseState, MapConnectionData, MapData, MapNodeData } from "@/lib/map/types";
import { and, eq, isNull, notInArray } from "drizzle-orm";

export async function getMapData(projectId: string): Promise<MapData> {
	const nodeRows = await db
		.select({
			id: mapNodes.id,
			type: mapNodes.type,
			label: mapNodes.label,
			description: mapNodes.description,
			insightId: mapNodes.insightId,
			positionX: mapNodes.positionX,
			positionY: mapNodes.positionY,
			isCollapsed: mapNodes.isCollapsed,
			createdBy: mapNodes.createdBy,
		})
		.from(mapNodes)
		.where(eq(mapNodes.projectId, projectId));

	const connectionRows = await db
		.select({
			id: mapConnections.id,
			sourceNodeId: mapConnections.sourceNodeId,
			targetNodeId: mapConnections.targetNodeId,
		})
		.from(mapConnections)
		.where(eq(mapConnections.projectId, projectId));

	// Pre-build lookup maps to avoid O(n²) scanning
	const outgoingByNode = new Map<string, number>();
	const incomingByNode = new Map<string, number>();
	const totalByNode = new Map<string, number>();
	for (const c of connectionRows) {
		outgoingByNode.set(c.sourceNodeId, (outgoingByNode.get(c.sourceNodeId) ?? 0) + 1);
		incomingByNode.set(c.targetNodeId, (incomingByNode.get(c.targetNodeId) ?? 0) + 1);
		totalByNode.set(c.sourceNodeId, (totalByNode.get(c.sourceNodeId) ?? 0) + 1);
		totalByNode.set(c.targetNodeId, (totalByNode.get(c.targetNodeId) ?? 0) + 1);
	}

	const nodesWithState: MapNodeData[] = nodeRows.map((node) => {
		const type = node.type as "insight" | "problem" | "solution";
		const baseState = deriveBaseStateFast(
			node.id,
			type,
			outgoingByNode.get(node.id) ?? 0,
			incomingByNode.get(node.id) ?? 0,
		);

		return {
			id: node.id,
			type,
			label: node.label,
			description: node.description,
			insightId: node.insightId,
			positionX: node.positionX,
			positionY: node.positionY,
			isCollapsed: node.isCollapsed,
			createdBy: node.createdBy,
			baseState,
			connectionCount: totalByNode.get(node.id) ?? 0,
		};
	});

	const connections: MapConnectionData[] = connectionRows.map((c) => ({
		id: c.id,
		sourceNodeId: c.sourceNodeId,
		targetNodeId: c.targetNodeId,
	}));

	return { nodes: nodesWithState, connections };
}

/** Insight cards that are NOT yet placed on the map */
export interface UnplacedInsight {
	id: string;
	statement: string;
	confidenceScore: number;
	themeTag: string | null;
}

export async function getUnplacedInsights(projectId: string): Promise<UnplacedInsight[]> {
	// Get insight IDs already on the map
	const placedRows = await db
		.select({ insightId: mapNodes.insightId })
		.from(mapNodes)
		.where(and(eq(mapNodes.projectId, projectId), eq(mapNodes.type, "insight")));

	const placedIds = placedRows.map((r) => r.insightId).filter((id): id is string => id !== null);

	const conditions = [eq(insightCards.projectId, projectId)];
	if (placedIds.length > 0) {
		conditions.push(notInArray(insightCards.id, placedIds));
	}

	return db
		.select({
			id: insightCards.id,
			statement: insightCards.statement,
			confidenceScore: insightCards.confidenceScore,
			themeTag: insightCards.themeTag,
		})
		.from(insightCards)
		.where(and(...conditions));
}

/**
 * Derive the base visual state using pre-computed counts (O(1) per node).
 */
function deriveBaseStateFast(
	_nodeId: string,
	type: "insight" | "problem" | "solution",
	outgoingCount: number,
	incomingCount: number,
): BaseState {
	switch (type) {
		case "insight":
			return outgoingCount > 0 ? "connected" : "unconnected";
		case "problem":
			return incomingCount > 0 || outgoingCount > 0 ? "connected" : "unconnected";
		case "solution":
			return incomingCount > 0 ? "connected" : "orphan";
		default:
			return "unconnected";
	}
}

/**
 * Derive the base visual state for a node based on its connections.
 * Kept for external callers (e.g. single-node updates).
 */
export function deriveBaseState(
	nodeId: string,
	type: "insight" | "problem" | "solution",
	connections: Array<{ sourceNodeId: string; targetNodeId: string }>,
): BaseState {
	const outgoing = connections.filter((c) => c.sourceNodeId === nodeId).length;
	const incoming = connections.filter((c) => c.targetNodeId === nodeId).length;
	return deriveBaseStateFast(nodeId, type, outgoing, incoming);
}
