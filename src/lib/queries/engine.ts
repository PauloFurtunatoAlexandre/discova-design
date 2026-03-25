import { db } from "@/lib/db";
import {
	insightCards,
	insightEvidence,
	mapConnections,
	mapNodes,
	quotes,
	researchNotes,
} from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export interface InsightWithRelations {
	id: string;
	statement: string;
	confidenceScore: number;
	themeTag: string | null;
	isAiGenerated: boolean;
	createdBy: { id: string; name: string };
	acceptedBy: { id: string; name: string } | null;
	createdAt: Date;
	updatedAt: Date;
	evidence: Array<{
		quoteId: string;
		quoteText: string;
		noteId: string;
		participantName: string;
		sessionDate: string;
		isStale: boolean;
	}>;
	evidenceCount: number;
	linkedProblem: {
		nodeId: string;
		label: string;
	} | null;
	isConnectedToMap: boolean;
}

// ─── Single Insight ────────────────────────────────────────────────────────────

export async function getInsightWithRelations(
	insightId: string,
): Promise<InsightWithRelations | null> {
	// Query 1: Fetch the insight card + creator/acceptor names via correlated subquery
	const [row] = await db
		.select({
			id: insightCards.id,
			statement: insightCards.statement,
			confidenceScore: insightCards.confidenceScore,
			themeTag: insightCards.themeTag,
			isAiGenerated: insightCards.isAiGenerated,
			createdById: insightCards.createdBy,
			acceptedById: insightCards.acceptedBy,
			createdAt: insightCards.createdAt,
			updatedAt: insightCards.updatedAt,
			creatorName: sql<string>`(SELECT name FROM users WHERE id = ${insightCards.createdBy})`,
			acceptorName: sql<
				string | null
			>`(SELECT name FROM users WHERE id = ${insightCards.acceptedBy})`,
		})
		.from(insightCards)
		.where(eq(insightCards.id, insightId))
		.limit(1);

	if (!row) return null;

	// Queries 2–3 in parallel
	const [evidenceRows, insightNodeRow] = await Promise.all([
		// Query 2: Fetch full evidence chain (insightEvidence → quotes → researchNotes)
		db
			.select({
				quoteId: quotes.id,
				quoteText: quotes.text,
				noteId: researchNotes.id,
				participantName: researchNotes.participantName,
				sessionDate: researchNotes.sessionDate,
				isStale: quotes.isStale,
			})
			.from(insightEvidence)
			.innerJoin(quotes, eq(quotes.id, insightEvidence.quoteId))
			.innerJoin(researchNotes, eq(researchNotes.id, quotes.noteId))
			.where(eq(insightEvidence.insightId, insightId)),

		// Query 3: Find the insight's map node (to check problem connections)
		db
			.select({ id: mapNodes.id })
			.from(mapNodes)
			.where(and(eq(mapNodes.insightId, insightId), eq(mapNodes.type, "insight")))
			.limit(1),
	]);

	// Query 4: Find connected problem (if insight has a map node)
	let linkedProblem: { nodeId: string; label: string } | null = null;
	if (insightNodeRow[0]) {
		const [problem] = await db
			.select({
				nodeId: mapNodes.id,
				label: mapNodes.label,
			})
			.from(mapConnections)
			.innerJoin(mapNodes, eq(mapNodes.id, mapConnections.targetNodeId))
			.where(
				and(eq(mapConnections.sourceNodeId, insightNodeRow[0].id), eq(mapNodes.type, "problem")),
			)
			.limit(1);

		linkedProblem = problem ?? null;
	}

	return {
		id: row.id,
		statement: row.statement,
		confidenceScore: row.confidenceScore,
		themeTag: row.themeTag,
		isAiGenerated: row.isAiGenerated,
		createdBy: { id: row.createdById, name: row.creatorName ?? "Unknown" },
		acceptedBy: row.acceptedById
			? { id: row.acceptedById, name: row.acceptorName ?? "Unknown" }
			: null,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		evidence: evidenceRows,
		evidenceCount: evidenceRows.length,
		linkedProblem,
		isConnectedToMap: linkedProblem !== null,
	};
}

// ─── Project Insight List ──────────────────────────────────────────────────────

export async function getProjectInsights(projectId: string): Promise<InsightWithRelations[]> {
	const rows = await db
		.select({
			id: insightCards.id,
			statement: insightCards.statement,
			confidenceScore: insightCards.confidenceScore,
			themeTag: insightCards.themeTag,
			isAiGenerated: insightCards.isAiGenerated,
			createdById: insightCards.createdBy,
			acceptedById: insightCards.acceptedBy,
			createdAt: insightCards.createdAt,
			updatedAt: insightCards.updatedAt,
			creatorName: sql<string>`(SELECT name FROM users WHERE id = ${insightCards.createdBy})`,
			acceptorName: sql<
				string | null
			>`(SELECT name FROM users WHERE id = ${insightCards.acceptedBy})`,
			// Evidence count via correlated subquery
			evidenceCount: sql<number>`(SELECT count(*)::int FROM insight_evidence WHERE insight_id = ${insightCards.id})`,
			// Linked problem (first connection via map graph)
			linkedProblemNodeId: sql<string | null>`(
				SELECT mn2.id FROM map_nodes mn
				INNER JOIN map_connections mc ON mc.source_node_id = mn.id
				INNER JOIN map_nodes mn2 ON mn2.id = mc.target_node_id
				WHERE mn.insight_id = ${insightCards.id}
				  AND mn.type = 'insight'
				  AND mn2.type = 'problem'
				LIMIT 1
			)`,
			linkedProblemLabel: sql<string | null>`(
				SELECT mn2.label FROM map_nodes mn
				INNER JOIN map_connections mc ON mc.source_node_id = mn.id
				INNER JOIN map_nodes mn2 ON mn2.id = mc.target_node_id
				WHERE mn.insight_id = ${insightCards.id}
				  AND mn.type = 'insight'
				  AND mn2.type = 'problem'
				LIMIT 1
			)`,
		})
		.from(insightCards)
		.where(eq(insightCards.projectId, projectId))
		.orderBy(desc(insightCards.createdAt));

	return rows.map((row) => ({
		id: row.id,
		statement: row.statement,
		confidenceScore: row.confidenceScore,
		themeTag: row.themeTag,
		isAiGenerated: row.isAiGenerated,
		createdBy: { id: row.createdById, name: row.creatorName ?? "Unknown" },
		acceptedBy: row.acceptedById
			? { id: row.acceptedById, name: row.acceptorName ?? "Unknown" }
			: null,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
		evidence: [], // Full evidence loaded on demand via getInsightWithRelations
		evidenceCount: row.evidenceCount,
		linkedProblem:
			row.linkedProblemNodeId && row.linkedProblemLabel
				? { nodeId: row.linkedProblemNodeId, label: row.linkedProblemLabel }
				: null,
		isConnectedToMap: row.linkedProblemNodeId !== null,
	}));
}
