"use server";

import { db } from "@/lib/db";
import { insightCards, insightEvidence, quotes, researchNotes } from "@/lib/db/schema";
import { type EvidenceInput, calculateConfidence } from "@/lib/engine/confidence";
import { logger } from "@/lib/logger";
import { eq } from "drizzle-orm";

/**
 * Recalculate and persist the confidence score for an insight.
 * Called whenever evidence links change (add/remove quote, note edit).
 *
 * This is NOT permission-guarded — it's an internal function called by
 * other guarded actions. Never expose directly to client.
 */
export async function recalculateConfidence(insightId: string): Promise<number> {
	// 1. Fetch all evidence for this insight: quote → note (for noteId + emotionalTone)
	const evidenceRows = await db
		.select({
			noteId: researchNotes.id,
			emotionalTone: researchNotes.emotionalTone,
		})
		.from(insightEvidence)
		.innerJoin(quotes, eq(insightEvidence.quoteId, quotes.id))
		.innerJoin(researchNotes, eq(quotes.noteId, researchNotes.id))
		.where(eq(insightEvidence.insightId, insightId));

	const evidence: EvidenceInput[] = evidenceRows.map((r) => ({
		noteId: r.noteId,
		emotionalTone: r.emotionalTone,
	}));

	// 2. Calculate score
	const score = calculateConfidence(evidence);

	// 3. Persist
	await db
		.update(insightCards)
		.set({ confidenceScore: score, updatedAt: new Date() })
		.where(eq(insightCards.id, insightId));

	logger.info({ insightId, score, evidenceCount: evidence.length }, "Confidence recalculated");

	return score;
}

/**
 * Batch recalculate confidence for multiple insights.
 * Used when a note's emotional tone changes (affects all insights linked to quotes from that note).
 */
export async function batchRecalculateForNote(noteId: string): Promise<void> {
	// Find all insights linked to quotes from this note
	const affectedInsights = await db
		.selectDistinct({ insightId: insightEvidence.insightId })
		.from(insightEvidence)
		.innerJoin(quotes, eq(insightEvidence.quoteId, quotes.id))
		.where(eq(quotes.noteId, noteId));

	for (const { insightId } of affectedInsights) {
		await recalculateConfidence(insightId);
	}
}
