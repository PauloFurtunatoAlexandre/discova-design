/**
 * Confidence score calculation for insight cards.
 *
 * Algorithm (from PRD):
 *   1. Group quotes by the note they belong to (unique source notes)
 *   2. Base score: first unique note = 30 points
 *   3. Each additional unique note = +15 points
 *   4. Sentiment weighting: if a note's emotional tone is "frustrated" or "delighted",
 *      that note's contribution is multiplied by 1.2×
 *   5. Cap at 90 — never 100% (research supports but never proves)
 *   6. If zero evidence: score = 0
 */

export interface EvidenceInput {
	noteId: string;
	emotionalTone: string | null;
}

export function calculateConfidence(evidence: EvidenceInput[]): number {
	if (evidence.length === 0) return 0;

	// Group by unique note IDs — first occurrence wins for tone
	const noteMap = new Map<string, { tone: string | null }>();
	for (const e of evidence) {
		if (!noteMap.has(e.noteId)) {
			noteMap.set(e.noteId, { tone: e.emotionalTone });
		}
	}

	const uniqueNotes = Array.from(noteMap.values());
	if (uniqueNotes.length === 0) return 0;

	let score = 0;

	for (let i = 0; i < uniqueNotes.length; i++) {
		const note = uniqueNotes[i];
		if (!note) continue;
		const { tone } = note;

		// Base contribution: first note = 30, each subsequent = 15
		const baseContribution = i === 0 ? 30 : 15;

		// Sentiment multiplier
		const sentimentMultiplier = tone === "frustrated" || tone === "delighted" ? 1.2 : 1.0;

		score += baseContribution * sentimentMultiplier;
	}

	return Math.min(90, Math.round(score));
}
