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

	const nodesWithState: MapNodeData[] = nodeRows.map((node) => {
		const type = node.type as "insight" | "problem" | "solution";
		const baseState = deriveBaseState(node.id, type, connectionRows);

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
			connectionCount: connectionRows.filter(
				(c) => c.sourceNodeId === node.id || c.targetNodeId === node.id,
			).length,
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
 * Derive the base visual state for a node based on its connections.
 *
 * - Insight: Connected if linked to at least 1 Problem (outgoing)
 * - Problem: Connected if has any connections
 * - Solution: Orphan if 0 incoming connections, Connected if >= 1
 */
export function deriveBaseState(
	nodeId: string,
	type: "insight" | "problem" | "solution",
	connections: Array<{ sourceNodeId: string; targetNodeId: string }>,
): BaseState {
	const outgoing = connections.filter((c) => c.sourceNodeId === nodeId);
	const incoming = connections.filter((c) => c.targetNodeId === nodeId);

	switch (type) {
		case "insight":
			return outgoing.length > 0 ? "connected" : "unconnected";

		case "problem":
			return incoming.length > 0 || outgoing.length > 0 ? "connected" : "unconnected";

		case "solution":
			return incoming.length > 0 ? "connected" : "orphan";

		default:
			return "unconnected";
	}
}
