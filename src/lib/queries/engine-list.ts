import { db } from "@/lib/db";
import { insightCards, mapConnections, mapNodes, users } from "@/lib/db/schema";
import { and, asc, count, desc, eq, gte, ilike, lte, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EngineListFilters {
	themeTag?: string | undefined;
	confidenceMin?: number | undefined;
	confidenceMax?: number | undefined;
	connectionStatus?: "connected" | "unconnected" | "all" | undefined;
	authorId?: string | undefined;
	search?: string | undefined;
	sortBy?:
		| "confidence_desc"
		| "confidence_asc"
		| "newest"
		| "oldest"
		| "recently_modified"
		| undefined;
	cursor?: string | undefined;
	limit?: number | undefined;
}

export interface EngineListInsight {
	id: string;
	statement: string;
	confidenceScore: number;
	themeTag: string | null;
	isAiGenerated: boolean;
	createdBy: { id: string; name: string };
	acceptedBy: { id: string; name: string } | null;
	createdAt: Date;
	updatedAt: Date;
	evidenceCount: number;
	linkedProblem: { nodeId: string; label: string } | null;
	isConnectedToMap: boolean;
}

export interface EngineListResult {
	insights: EngineListInsight[];
	totalCount: number;
	connectedCount: number;
	hasMore: boolean;
	nextCursor: string | null;
}

// ── Query ──────────────────────────────────────────────────────────────────────

export async function getEngineList(
	projectId: string,
	filters: EngineListFilters,
): Promise<EngineListResult> {
	const limit = filters.limit ?? 20;
	const fetchLimit = limit + 1;
	const sortBy = filters.sortBy ?? "confidence_desc";

	// Build filter conditions
	function buildBaseConditions() {
		// biome-ignore lint/suspicious/noExplicitAny: Drizzle condition union types
		const conditions: any[] = [eq(insightCards.projectId, projectId)];

		if (filters.search?.trim()) {
			const term = `%${filters.search.trim()}%`;
			conditions.push(ilike(insightCards.statement, term));
		}

		if (filters.themeTag) {
			conditions.push(eq(insightCards.themeTag, filters.themeTag));
		}

		if (filters.confidenceMin !== undefined) {
			conditions.push(gte(insightCards.confidenceScore, filters.confidenceMin));
		}

		if (filters.confidenceMax !== undefined) {
			conditions.push(lte(insightCards.confidenceScore, filters.confidenceMax));
		}

		if (filters.connectionStatus === "connected") {
			conditions.push(
				sql`EXISTS (
					SELECT 1 FROM map_nodes mn
					INNER JOIN map_connections mc ON mc.source_node_id = mn.id
					WHERE mn.insight_id = ${insightCards.id}
					AND mn.type = 'insight'
				)`,
			);
		} else if (filters.connectionStatus === "unconnected") {
			conditions.push(
				sql`NOT EXISTS (
					SELECT 1 FROM map_nodes mn
					INNER JOIN map_connections mc ON mc.source_node_id = mn.id
					WHERE mn.insight_id = ${insightCards.id}
					AND mn.type = 'insight'
				)`,
			);
		}

		if (filters.authorId) {
			conditions.push(eq(insightCards.createdBy, filters.authorId));
		}

		return conditions;
	}

	const baseConditions = buildBaseConditions();

	// Cursor-based pagination
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle condition union types
	const paginatedConditions: any[] = [...baseConditions];

	if (filters.cursor) {
		const [cursorValue, cursorId] = filters.cursor.split("|");
		if (cursorValue && cursorId) {
			if (sortBy === "confidence_desc") {
				paginatedConditions.push(
					sql`(${insightCards.confidenceScore}, ${insightCards.createdAt}, ${insightCards.id}::text) < (${Number(cursorValue)}, (SELECT created_at FROM insight_cards WHERE insight_cards.id = ${cursorId}::uuid), ${cursorId})`,
				);
			} else if (sortBy === "newest" || sortBy === "recently_modified") {
				paginatedConditions.push(
					sql`(${sortBy === "recently_modified" ? insightCards.updatedAt : insightCards.createdAt}, ${insightCards.id}::text) < (${cursorValue}::timestamptz, ${cursorId})`,
				);
			} else if (sortBy === "oldest") {
				paginatedConditions.push(
					sql`(${insightCards.createdAt}, ${insightCards.id}::text) > (${cursorValue}::timestamptz, ${cursorId})`,
				);
			} else if (sortBy === "confidence_asc") {
				paginatedConditions.push(
					sql`(${insightCards.confidenceScore}, ${insightCards.createdAt}, ${insightCards.id}::text) > (${Number(cursorValue)}, (SELECT created_at FROM insight_cards WHERE insight_cards.id = ${cursorId}::uuid), ${cursorId})`,
				);
			}
		}
	}

	// Use raw table-qualified refs inside correlated subqueries in SELECT fields.
	// Drizzle doesn't qualify column refs in SELECT (only in WHERE), so
	// ${insightCards.id} generates bare "id" — ambiguous inside JOINed subqueries.
	const icId = sql.raw('"insight_cards"."id"');
	const icCreatedBy = sql.raw('"insight_cards"."created_by"');
	const icAcceptedBy = sql.raw('"insight_cards"."accepted_by"');

	const selectFields = {
		id: insightCards.id,
		statement: insightCards.statement,
		confidenceScore: insightCards.confidenceScore,
		themeTag: insightCards.themeTag,
		isAiGenerated: insightCards.isAiGenerated,
		createdById: insightCards.createdBy,
		acceptedById: insightCards.acceptedBy,
		createdAt: insightCards.createdAt,
		updatedAt: insightCards.updatedAt,
		creatorName: sql<string>`(SELECT name FROM users WHERE users.id = ${icCreatedBy})`,
		acceptorName: sql<string | null>`(SELECT name FROM users WHERE users.id = ${icAcceptedBy})`,
		evidenceCount:
			sql<number>`(SELECT count(*)::int FROM insight_evidence WHERE insight_id = ${icId})`.mapWith(
				Number,
			),
		linkedProblemNodeId: sql<string | null>`(
			SELECT mn2.id FROM map_nodes mn
			INNER JOIN map_connections mc ON mc.source_node_id = mn.id
			INNER JOIN map_nodes mn2 ON mn2.id = mc.target_node_id
			WHERE mn.insight_id = ${icId}
			  AND mn.type = 'insight'
			  AND mn2.type = 'problem'
			LIMIT 1
		)`,
		linkedProblemLabel: sql<string | null>`(
			SELECT mn2.label FROM map_nodes mn
			INNER JOIN map_connections mc ON mc.source_node_id = mn.id
			INNER JOIN map_nodes mn2 ON mn2.id = mc.target_node_id
			WHERE mn.insight_id = ${icId}
			  AND mn.type = 'insight'
			  AND mn2.type = 'problem'
			LIMIT 1
		)`,
	};

	// Run total count, connected count, and paginated query in parallel
	const [countResult, connectedResult, insightRows] = await Promise.all([
		db
			.select({ total: count() })
			.from(insightCards)
			.where(and(...baseConditions)),

		db
			.select({ total: count() })
			.from(insightCards)
			.where(
				and(
					eq(insightCards.projectId, projectId),
					sql`EXISTS (
						SELECT 1 FROM map_nodes mn
						INNER JOIN map_connections mc ON mc.source_node_id = mn.id
						WHERE mn.insight_id = ${insightCards.id}
						AND mn.type = 'insight'
					)`,
				),
			),

		(async () => {
			const base = db
				.select(selectFields)
				.from(insightCards)
				.where(and(...paginatedConditions));

			switch (sortBy) {
				case "confidence_asc":
					return base
						.orderBy(
							asc(insightCards.confidenceScore),
							asc(insightCards.createdAt),
							asc(insightCards.id),
						)
						.limit(fetchLimit);
				case "newest":
					return base
						.orderBy(desc(insightCards.createdAt), desc(insightCards.id))
						.limit(fetchLimit);
				case "oldest":
					return base.orderBy(asc(insightCards.createdAt), asc(insightCards.id)).limit(fetchLimit);
				case "recently_modified":
					return base
						.orderBy(desc(insightCards.updatedAt), desc(insightCards.id))
						.limit(fetchLimit);
				default: // confidence_desc
					return base
						.orderBy(
							desc(insightCards.confidenceScore),
							desc(insightCards.createdAt),
							desc(insightCards.id),
						)
						.limit(fetchLimit);
			}
		})(),
	]);

	const totalCount = Number(countResult[0]?.total ?? 0);
	const connectedCount = Number(connectedResult[0]?.total ?? 0);
	const hasMore = insightRows.length > limit;
	const rows = hasMore ? insightRows.slice(0, limit) : insightRows;

	// Build next cursor
	const lastRow = rows[rows.length - 1];
	let nextCursor: string | null = null;
	if (hasMore && lastRow) {
		if (sortBy === "confidence_desc" || sortBy === "confidence_asc") {
			nextCursor = `${lastRow.confidenceScore}|${lastRow.id}`;
		} else if (sortBy === "recently_modified") {
			nextCursor = `${lastRow.updatedAt.toISOString()}|${lastRow.id}`;
		} else {
			nextCursor = `${lastRow.createdAt.toISOString()}|${lastRow.id}`;
		}
	}

	const insights: EngineListInsight[] = rows.map((row) => ({
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
		evidenceCount: row.evidenceCount,
		linkedProblem:
			row.linkedProblemNodeId && row.linkedProblemLabel
				? { nodeId: row.linkedProblemNodeId, label: row.linkedProblemLabel }
				: null,
		isConnectedToMap: row.linkedProblemNodeId !== null,
	}));

	return { insights, totalCount, connectedCount, hasMore, nextCursor };
}

// ── Helper queries for filter options ──────────────────────────────────────────

export async function getProjectThemeTags(projectId: string): Promise<string[]> {
	const rows = await db
		.selectDistinct({ themeTag: insightCards.themeTag })
		.from(insightCards)
		.where(and(eq(insightCards.projectId, projectId), sql`${insightCards.themeTag} IS NOT NULL`));

	return rows.map((r) => r.themeTag).filter((t): t is string => t !== null);
}

export async function getProjectInsightAuthors(
	projectId: string,
): Promise<Array<{ id: string; name: string }>> {
	const rows = await db
		.selectDistinct({
			id: users.id,
			name: users.name,
		})
		.from(insightCards)
		.innerJoin(users, eq(users.id, insightCards.createdBy))
		.where(eq(insightCards.projectId, projectId));

	return rows;
}
