// Confidence score calculation for insight cards
// This is pure business logic — no DB calls, no side effects.
// Formula agreed in PRD:
//   - 1 linked quote = 30% base
//   - Each additional quote from a DIFFERENT note = +15%
//   - Quotes with strong sentiment (frustrated/delighted) are weighted 1.2x
//   - Hard cap at 90% — certainty is epistemically wrong for user research

export interface QuoteForScoring {
  noteId: string
  emotionalTone?: "frustrated" | "delighted" | "neutral" | "mixed" | null
}

const BASE_SCORE        = 0.30  // first quote
const PER_ADDITIONAL    = 0.15  // each additional quote from a different note
const SENTIMENT_WEIGHT  = 1.2   // multiplier for frustrated or delighted
const MAX_SCORE         = 0.90  // hard cap

/**
 * Calculate the confidence score for an insight card based on its linked quotes.
 * Returns a value between 0 and 0.90.
 */
export function calculateConfidenceScore(quotes: QuoteForScoring[]): number {
  if (quotes.length === 0) return 0

  // Deduplicate by noteId — count unique notes, not quote count
  const uniqueNoteIds = new Set(quotes.map((q) => q.noteId))
  const uniqueNoteCount = uniqueNoteIds.size

  // Base: first unique note = 30%
  let score = BASE_SCORE

  // Additional unique notes: each adds 15%
  if (uniqueNoteCount > 1) {
    score += (uniqueNoteCount - 1) * PER_ADDITIONAL
  }

  // Sentiment boost: if any quote has strong sentiment, apply multiplier
  const hasStrongSentiment = quotes.some(
    (q) => q.emotionalTone === "frustrated" || q.emotionalTone === "delighted"
  )
  if (hasStrongSentiment) {
    score = score * SENTIMENT_WEIGHT
  }

  // Hard cap
  return Math.min(score, MAX_SCORE)
}

/**
 * Format confidence score for display (e.g. 0.74 → "74%")
 */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`
}
