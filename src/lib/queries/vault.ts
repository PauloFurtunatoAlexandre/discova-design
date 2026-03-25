import { db } from "@/lib/db";
import {
	insightCards,
	insightEvidence,
	noteTags,
	quotes,
	researchNotes,
	tags,
} from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";

export interface LinkedInsight {
	id: string;
	statement: string;
	confidenceScore: number;
}

export interface NoteQuote {
	id: string;
	text: string;
	startOffset: number;
	endOffset: number;
	isStale: boolean;
	linkedInsightCount: number;
}

export interface NoteWithRelations {
	id: string;
	projectId: string;
	participantName: string;
	sessionDate: string;
	rawContent: string;
	researchMethod: string | null;
	userSegment: string | null;
	emotionalTone: string | null;
	assumptionsTested: string | null;
	followUpNeeded: boolean;
	sessionRecordingUrl: string | null;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	quotes: NoteQuote[];
	tags: string[];
	linkedInsights: LinkedInsight[];
	linkedInsightCount: number;
}

export async function getNoteWithRelations(noteId: string): Promise<NoteWithRelations | null> {
	// Query 1: Fetch the note
	const note = await db.query.researchNotes.findFirst({
		where: eq(researchNotes.id, noteId),
		columns: {
			id: true,
			projectId: true,
			participantName: true,
			sessionDate: true,
			rawContent: true,
			researchMethod: true,
			userSegment: true,
			emotionalTone: true,
			assumptionsTested: true,
			followUpNeeded: true,
			sessionRecordingUrl: true,
			createdBy: true,
			createdAt: true,
			updatedAt: true,
		},
	});

	if (!note) return null;

	// Queries 2–4 in parallel
	const [quotesWithCounts, tagRows, linkedInsightRows] = await Promise.all([
		// Query 2: Quotes + linked insight counts
		db
			.select({
				id: quotes.id,
				text: quotes.text,
				startOffset: quotes.startOffset,
				endOffset: quotes.endOffset,
				isStale: quotes.isStale,
				linkedInsightCount: count(insightEvidence.id),
			})
			.from(quotes)
			.leftJoin(insightEvidence, eq(insightEvidence.quoteId, quotes.id))
			.where(eq(quotes.noteId, noteId))
			.groupBy(quotes.id, quotes.text, quotes.startOffset, quotes.endOffset, quotes.isStale),

		// Query 3: Tags linked to this note
		db
			.select({ name: tags.name })
			.from(noteTags)
			.innerJoin(tags, eq(tags.id, noteTags.tagId))
			.where(eq(noteTags.noteId, noteId)),

		// Query 4: Distinct insight cards linked via quotes from this note
		db
			.selectDistinct({
				id: insightCards.id,
				statement: insightCards.statement,
				confidenceScore: insightCards.confidenceScore,
			})
			.from(insightCards)
			.innerJoin(insightEvidence, eq(insightEvidence.insightId, insightCards.id))
			.innerJoin(quotes, eq(quotes.id, insightEvidence.quoteId))
			.where(eq(quotes.noteId, noteId)),
	]);

	return {
		...note,
		quotes: quotesWithCounts.map((q) => ({
			...q,
			linkedInsightCount: Number(q.linkedInsightCount),
		})),
		tags: tagRows.map((r) => r.name),
		linkedInsights: linkedInsightRows,
		linkedInsightCount: linkedInsightRows.length,
	};
}
