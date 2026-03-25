/** A single AI-suggested insight before the user accepts it */
export interface AISuggestion {
	id: string; // client-generated UUID for tracking
	statement: string; // one declarative sentence
	supportingEvidence: Array<{
		quoteText: string; // the text span from the note
		startOffset: number; // position in the note content
		endOffset: number;
	}>;
	suggestedThemeTag: string; // e.g., "onboarding", "friction", "retention"
	suggestedProblemMapping?: string; // existing problem label if one seems relevant
	confidence: "high" | "medium" | "low"; // AI's self-assessed confidence
}

/** State of the analysis flow */
export type AnalysisState =
	| { status: "idle" }
	| { status: "reading"; currentParagraph: number; totalParagraphs: number }
	| { status: "analysing"; statusText: string }
	| { status: "streaming"; suggestions: AISuggestion[] }
	| { status: "complete"; suggestions: AISuggestion[] }
	| { status: "error"; message: string; canRetry: boolean }
	| { status: "rate_limited"; retryAfterSeconds: number };
