import { db } from "@/lib/db";
import { mapConnections, mapNodes, stackItems, stackSnapshots } from "@/lib/db/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface StackItemWithNode {
	id: string;
	solutionNodeId: string;
	solutionLabel: string;
	solutionDescription: string | null;
	/** Number of incoming connections to the solution node */
	connectionCount: number;
	/** Problem labels connected (via problem→solution edges) */
	linkedProblems: string[];
	// RICE fields
	reachAuto: number | null;
	reachOverride: number | null;
	impactAuto: number | null;
	impactOverride: number | null;
	confidenceAuto: number | null;
	confidenceOverride: number | null;
	effortManual: number | null;
	effortJiraEstimate: number | null;
	effortLinearEstimate: number | null;
	riceScore: number | null;
	tier: "now" | "next" | "later" | "someday" | null;
	lastEditedBy: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export type StackSortBy =
	| "rice_desc"
	| "rice_asc"
	| "tier"
	| "label_asc"
	| "label_desc"
	| "newest"
	| "oldest";

// ── Main query ─────────────────────────────────────────────────────────────────

export async function getStackItems(
	projectId: string,
	sortBy: StackSortBy = "rice_desc",
): Promise<StackItemWithNode[]> {
	const siId = sql.raw('"stack_items"."id"');
	const siSolutionNodeId = sql.raw('"stack_items"."solution_node_id"');

	const rows = await db
		.select({
			id: stackItems.id,
			solutionNodeId: stackItems.solutionNodeId,
			solutionLabel: sql<string>`(
				SELECT label FROM map_nodes WHERE map_nodes.id = ${siSolutionNodeId}
			)`,
			solutionDescription: sql<string | null>`(
				SELECT description FROM map_nodes WHERE map_nodes.id = ${siSolutionNodeId}
			)`,
			connectionCount: sql<number>`(
				SELECT COUNT(*)::int FROM map_connections
				WHERE target_node_id = ${siSolutionNodeId}
			)`.mapWith(Number),
			reachAuto: stackItems.reachAuto,
			reachOverride: stackItems.reachOverride,
			impactAuto: stackItems.impactAuto,
			impactOverride: stackItems.impactOverride,
			confidenceAuto: stackItems.confidenceAuto,
			confidenceOverride: stackItems.confidenceOverride,
			effortManual: stackItems.effortManual,
			effortJiraEstimate: stackItems.effortJiraEstimate,
			effortLinearEstimate: stackItems.effortLinearEstimate,
			riceScore: stackItems.riceScore,
			tier: stackItems.tier,
			lastEditedBy: stackItems.lastEditedBy,
			createdAt: stackItems.createdAt,
			updatedAt: stackItems.updatedAt,
		})
		.from(stackItems)
		.where(eq(stackItems.projectId, projectId))
		.orderBy(
			...(sortBy === "rice_desc"
				? [desc(stackItems.riceScore), desc(stackItems.createdAt)]
				: sortBy === "rice_asc"
					? [asc(stackItems.riceScore), asc(stackItems.createdAt)]
					: sortBy === "tier"
						? [
								sql`CASE ${stackItems.tier}
									WHEN 'now' THEN 0
									WHEN 'next' THEN 1
									WHEN 'later' THEN 2
									WHEN 'someday' THEN 3
									ELSE 4
								END`,
								desc(stackItems.riceScore),
							]
						: sortBy === "label_asc"
							? [sql`(SELECT label FROM map_nodes WHERE map_nodes.id = ${siSolutionNodeId})`]
							: sortBy === "label_desc"
								? [
										desc(
											sql`(SELECT label FROM map_nodes WHERE map_nodes.id = ${siSolutionNodeId})`,
										),
									]
								: sortBy === "oldest"
									? [asc(stackItems.createdAt)]
									: [desc(stackItems.createdAt)]),
		);

	// Batch-fetch linked problems for all stack items
	const solutionNodeIds = rows.map((r) => r.solutionNodeId);
	const problemMap = await fetchLinkedProblems(solutionNodeIds);

	return rows.map((row) => ({
		id: row.id,
		solutionNodeId: row.solutionNodeId,
		solutionLabel: row.solutionLabel ?? "Untitled",
		solutionDescription: row.solutionDescription,
		connectionCount: row.connectionCount,
		linkedProblems: problemMap.get(row.solutionNodeId) ?? [],
		reachAuto: row.reachAuto,
		reachOverride: row.reachOverride,
		impactAuto: row.impactAuto,
		impactOverride: row.impactOverride,
		confidenceAuto: row.confidenceAuto,
		confidenceOverride: row.confidenceOverride,
		effortManual: row.effortManual,
		effortJiraEstimate: row.effortJiraEstimate,
		effortLinearEstimate: row.effortLinearEstimate,
		riceScore: row.riceScore,
		tier: row.tier as StackItemWithNode["tier"],
		lastEditedBy: row.lastEditedBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	}));
}

// ── Linked problems ────────────────────────────────────────────────────────────

async function fetchLinkedProblems(solutionNodeIds: string[]): Promise<Map<string, string[]>> {
	if (!solutionNodeIds.length) return new Map();

	const rows = await db
		.select({
			targetNodeId: mapConnections.targetNodeId,
			problemLabel: mapNodes.label,
		})
		.from(mapConnections)
		.innerJoin(mapNodes, eq(mapNodes.id, mapConnections.sourceNodeId))
		.where(
			and(
				sql`${mapConnections.targetNodeId} = ANY(${solutionNodeIds}::uuid[])`,
				eq(mapNodes.type, "problem"),
			),
		);

	const map = new Map<string, string[]>();
	for (const row of rows) {
		const existing = map.get(row.targetNodeId) ?? [];
		existing.push(row.problemLabel);
		map.set(row.targetNodeId, existing);
	}
	return map;
}

// ── Sync solution nodes → stack items ──────────────────────────────────────────

/**
 * Ensures every "solution" map node has a corresponding stack_items row.
 * Does NOT remove stack items for deleted nodes (cascade handles that).
 * Returns the number of newly created items.
 */
export async function syncSolutionNodesToStack(projectId: string): Promise<number> {
	// Find solution nodes without a stack item
	const unsynced = await db
		.select({ id: mapNodes.id })
		.from(mapNodes)
		.where(
			and(
				eq(mapNodes.projectId, projectId),
				eq(mapNodes.type, "solution"),
				sql`NOT EXISTS (
					SELECT 1 FROM stack_items si
					WHERE si.solution_node_id = ${mapNodes.id}
				)`,
			),
		);

	if (!unsynced.length) return 0;

	await db.insert(stackItems).values(
		unsynced.map((node) => ({
			projectId,
			solutionNodeId: node.id,
		})),
	);

	return unsynced.length;
}

// ── Stack stats ────────────────────────────────────────────────────────────────

export async function getStackStats(projectId: string): Promise<{
	totalItems: number;
	scoredItems: number;
	tieredItems: number;
}> {
	const [result] = await db
		.select({
			totalItems: sql<number>`COUNT(*)::int`.mapWith(Number),
			scoredItems: sql<number>`COUNT(*) FILTER (WHERE rice_score IS NOT NULL)::int`.mapWith(Number),
			tieredItems: sql<number>`COUNT(*) FILTER (WHERE tier IS NOT NULL)::int`.mapWith(Number),
		})
		.from(stackItems)
		.where(eq(stackItems.projectId, projectId));

	return {
		totalItems: result?.totalItems ?? 0,
		scoredItems: result?.scoredItems ?? 0,
		tieredItems: result?.tieredItems ?? 0,
	};
}

// ── Active snapshot (lock state) ──────────────────────────────────────────────

export interface ActiveSnapshot {
	id: string;
	lockedBy: string;
	lockedByName: string;
	lockedAt: Date;
	shareViewMode: "stakeholder" | "presentation";
	shareToken: string;
	createdAt: Date;
}

export async function getActiveSnapshot(projectId: string): Promise<ActiveSnapshot | null> {
	const [row] = await db
		.select({
			id: stackSnapshots.id,
			lockedBy: stackSnapshots.lockedBy,
			lockedByName: sql<string>`(SELECT name FROM users WHERE users.id = ${stackSnapshots.lockedBy})`,
			lockedAt: stackSnapshots.lockedAt,
			shareViewMode: stackSnapshots.shareViewMode,
			shareToken: stackSnapshots.shareToken,
			createdAt: stackSnapshots.createdAt,
		})
		.from(stackSnapshots)
		.where(eq(stackSnapshots.projectId, projectId))
		.orderBy(desc(stackSnapshots.createdAt))
		.limit(1);

	if (!row) return null;

	return {
		id: row.id,
		lockedBy: row.lockedBy,
		lockedByName: row.lockedByName ?? "Unknown",
		lockedAt: row.lockedAt,
		shareViewMode: row.shareViewMode as ActiveSnapshot["shareViewMode"],
		shareToken: row.shareToken,
		createdAt: row.createdAt,
	};
}

// ── Snapshot by share token ───────────────────────────────────────────────────

export interface SnapshotWithData {
	id: string;
	projectId: string;
	snapshotData: unknown;
	shareViewMode: "stakeholder" | "presentation";
	sharePasscodeHash: string;
	lockedAt: Date;
}

export async function getSnapshotByToken(token: string): Promise<SnapshotWithData | null> {
	const [row] = await db
		.select({
			id: stackSnapshots.id,
			projectId: stackSnapshots.projectId,
			snapshotData: stackSnapshots.snapshotData,
			shareViewMode: stackSnapshots.shareViewMode,
			sharePasscodeHash: stackSnapshots.sharePasscodeHash,
			lockedAt: stackSnapshots.lockedAt,
		})
		.from(stackSnapshots)
		.where(eq(stackSnapshots.shareToken, token))
		.limit(1);

	if (!row) return null;

	return {
		id: row.id,
		projectId: row.projectId,
		snapshotData: row.snapshotData,
		shareViewMode: row.shareViewMode as SnapshotWithData["shareViewMode"],
		sharePasscodeHash: row.sharePasscodeHash,
		lockedAt: row.lockedAt,
	};
}
