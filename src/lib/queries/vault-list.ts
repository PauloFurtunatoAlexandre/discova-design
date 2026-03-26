import { db } from "@/lib/db";
import { insightEvidence, noteTags, quotes, researchNotes, tags } from "@/lib/db/schema";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface NoteListItem {
	id: string;
	participantName: string;
	sessionDate: string;
	rawContentPreview: string;
	researchMethod: string | null;
	emotionalTone: string | null;
	followUpNeeded: boolean;
	quoteCount: number;
	insightCount: number;
	createdAt: Date;
	tags: string[];
}

export interface VaultListFilters {
	search?: string | undefined;
	researchMethod?: string[] | undefined;
	emotionalTone?: string | undefined;
	dateFrom?: string | undefined;
	dateTo?: string | undefined;
	followUpNeeded?: boolean | undefined;
	tags?: string[] | undefined;
	sortBy?:
		| "newest"
		| "oldest"
		| "participant_asc"
		| "participant_desc"
		| "quote_count"
		| "follow_up_first"
		| undefined;
	cursor?: string | undefined;
	limit?: number | undefined;
}

export interface VaultListResult {
	notes: NoteListItem[];
	totalCount: number;
	hasMore: boolean;
	nextCursor: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

export function extractPreview(rawContent: string, maxLength = 120): string {
	try {
		const doc = JSON.parse(rawContent) as Record<string, unknown>;
		if (doc?.type === "doc" && Array.isArray(doc.content)) {
			const text = extractTextFromTiptap(doc).replace(/\s+/g, " ").trim();
			return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
		}
	} catch {
		// Not JSON — plain text fallback
	}
	const trimmed = rawContent.replace(/\s+/g, " ").trim();
	return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength)}...` : trimmed;
}

function extractTextFromTiptap(node: unknown): string {
	if (!node || typeof node !== "object") return "";
	const n = node as Record<string, unknown>;
	if (n.type === "text" && typeof n.text === "string") return n.text;
	if (Array.isArray(n.content)) {
		return (n.content as unknown[]).map(extractTextFromTiptap).filter(Boolean).join(" ");
	}
	return "";
}

async function fetchTagsByNoteIds(noteIds: string[]): Promise<Map<string, string[]>> {
	if (!noteIds.length) return new Map();
	const rows = await db
		.select({ noteId: noteTags.noteId, tagName: tags.name })
		.from(noteTags)
		.innerJoin(tags, eq(tags.id, noteTags.tagId))
		.where(inArray(noteTags.noteId, noteIds));

	const map = new Map<string, string[]>();
	for (const row of rows) {
		const existing = map.get(row.noteId) ?? [];
		existing.push(row.tagName);
		map.set(row.noteId, existing);
	}
	return map;
}

// ── Query ──────────────────────────────────────────────────────────────────────

export async function getVaultList(
	projectId: string,
	filters: VaultListFilters,
): Promise<VaultListResult> {
	const limit = filters.limit ?? 20;
	const fetchLimit = limit + 1;
	const sortBy = filters.sortBy ?? "newest";

	// Build filter conditions (no cursor — used for total count)
	function buildBaseConditions() {
		// biome-ignore lint/suspicious/noExplicitAny: Drizzle condition union types
		const conditions: any[] = [eq(researchNotes.projectId, projectId)];

		if (filters.search?.trim()) {
			const term = `%${filters.search.trim()}%`;
			const searchOr = or(
				ilike(researchNotes.participantName, term),
				ilike(researchNotes.rawContent, term),
			);
			if (searchOr) conditions.push(searchOr);
		}

		if (filters.researchMethod?.length) {
			conditions.push(
				sql`${researchNotes.researchMethod} = ANY(${filters.researchMethod}::text[])`,
			);
		}

		if (filters.emotionalTone) {
			conditions.push(sql`${researchNotes.emotionalTone} = ${filters.emotionalTone}`);
		}

		if (filters.dateFrom) {
			conditions.push(gte(researchNotes.sessionDate, filters.dateFrom));
		}

		if (filters.dateTo) {
			conditions.push(lte(researchNotes.sessionDate, filters.dateTo));
		}

		if (filters.followUpNeeded === true) {
			conditions.push(eq(researchNotes.followUpNeeded, true));
		}

		if (filters.tags?.length) {
			for (const tagName of filters.tags) {
				conditions.push(
					sql`EXISTS (
						SELECT 1 FROM note_tags nt
						JOIN tags t ON t.id = nt.tag_id
						WHERE nt.note_id = ${researchNotes.id}
						AND t.name = ${tagName}
					)`,
				);
			}
		}

		return conditions;
	}

	const baseConditions = buildBaseConditions();

	// Add cursor for stable keyset pagination (newest/oldest only)
	// biome-ignore lint/suspicious/noExplicitAny: Drizzle condition union types
	const paginatedConditions: any[] = [...baseConditions];
	if (filters.cursor && (sortBy === "newest" || sortBy === "oldest")) {
		const [cursorDateStr, cursorId] = filters.cursor.split("|");
		if (cursorDateStr && cursorId) {
			if (sortBy === "newest") {
				paginatedConditions.push(
					sql`(${researchNotes.createdAt}, ${researchNotes.id}::text) < (${cursorDateStr}::timestamptz, ${cursorId})`,
				);
			} else {
				paginatedConditions.push(
					sql`(${researchNotes.createdAt}, ${researchNotes.id}::text) > (${cursorDateStr}::timestamptz, ${cursorId})`,
				);
			}
		}
	}

	// Use raw table-qualified refs inside correlated subqueries in SELECT fields.
	// Drizzle doesn't qualify column refs in SELECT (only in WHERE), so
	// ${researchNotes.id} generates bare "id" — wrong scope in subqueries.
	const rnId = sql.raw('"research_notes"."id"');

	// Shared SELECT fields with correlated subquery counts
	const selectFields = {
		id: researchNotes.id,
		participantName: researchNotes.participantName,
		sessionDate: researchNotes.sessionDate,
		rawContent: researchNotes.rawContent,
		researchMethod: researchNotes.researchMethod,
		emotionalTone: researchNotes.emotionalTone,
		followUpNeeded: researchNotes.followUpNeeded,
		createdAt: researchNotes.createdAt,
		quoteCount: sql<number>`(SELECT COUNT(*) FROM quotes WHERE note_id = ${rnId})`.mapWith(Number),
		insightCount:
			sql<number>`(SELECT COUNT(DISTINCT insight_id) FROM insight_evidence WHERE quote_id IN (SELECT quotes.id FROM quotes WHERE quotes.note_id = ${rnId}))`.mapWith(
				Number,
			),
	};

	// Run total count + paginated notes in parallel
	const [countResult, noteRows] = await Promise.all([
		db
			.select({ total: count() })
			.from(researchNotes)
			.where(and(...baseConditions)),

		// Sort-specific query to avoid TypeScript spread issues with Drizzle's builder types
		(async () => {
			const base = db
				.select(selectFields)
				.from(researchNotes)
				.where(and(...paginatedConditions));

			switch (sortBy) {
				case "oldest":
					return base
						.orderBy(asc(researchNotes.createdAt), asc(researchNotes.id))
						.limit(fetchLimit);
				case "participant_asc":
					return base.orderBy(asc(researchNotes.participantName)).limit(fetchLimit);
				case "participant_desc":
					return base.orderBy(desc(researchNotes.participantName)).limit(fetchLimit);
				case "follow_up_first":
					return base
						.orderBy(desc(researchNotes.followUpNeeded), desc(researchNotes.createdAt))
						.limit(fetchLimit);
				case "quote_count":
					return base
						.orderBy(
							desc(sql`(SELECT COUNT(*) FROM quotes WHERE note_id = ${rnId})`),
							desc(researchNotes.createdAt),
						)
						.limit(fetchLimit);
				default: // newest
					return base
						.orderBy(desc(researchNotes.createdAt), desc(researchNotes.id))
						.limit(fetchLimit);
			}
		})(),
	]);

	const totalCount = Number(countResult[0]?.total ?? 0);
	const hasMore = noteRows.length > limit;
	const notes = hasMore ? noteRows.slice(0, limit) : noteRows;

	// Fetch tags for all returned notes in one query
	const noteIds = notes.map((n) => n.id);
	const tagsByNoteId = await fetchTagsByNoteIds(noteIds);

	// Cursor for next page (keyset pagination only for newest/oldest)
	const lastNote = notes[notes.length - 1];
	const nextCursor =
		hasMore && lastNote && (sortBy === "newest" || sortBy === "oldest")
			? `${lastNote.createdAt.toISOString()}|${lastNote.id}`
			: null;

	const items: NoteListItem[] = notes.map((n) => ({
		id: n.id,
		participantName: n.participantName,
		sessionDate: n.sessionDate,
		rawContentPreview: extractPreview(n.rawContent),
		researchMethod: n.researchMethod,
		emotionalTone: n.emotionalTone,
		followUpNeeded: n.followUpNeeded,
		quoteCount: n.quoteCount,
		insightCount: n.insightCount,
		createdAt: n.createdAt,
		tags: tagsByNoteId.get(n.id) ?? [],
	}));

	return { notes: items, totalCount, hasMore, nextCursor };
}
