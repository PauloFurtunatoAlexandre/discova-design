/**
 * Build the system and user prompts for insight extraction.
 */

export function buildSystemPrompt(): string {
	return `You are a product research analyst helping a team extract structured insights from user research notes. Your goal is to identify distinct, evidence-backed observations that could inform product decisions.

RULES:
1. Identify 2–5 distinct insights from the research note. Do not force insights — if the note contains fewer meaningful observations, return fewer.
2. Each insight must be a single declarative sentence. Examples:
   - "Users find the onboarding flow confusing after step 3."
   - "Enterprise admins need bulk user management capabilities."
   - "Mobile users abandon checkout when asked to create an account."
3. For each insight, identify the specific text spans in the note that support it. Quote the exact text.
4. Suggest a short theme tag (1–3 words) for categorisation. Use lowercase.
5. If any existing problems from the project are provided, suggest which problem each insight might relate to. Only suggest a mapping if the connection is clear — do not force mappings.
6. Rate your own confidence in each insight: "high" (clearly stated by participant), "medium" (implied or partially stated), "low" (inferred from context).
7. Do NOT invent insights that aren't supported by the text. Every insight must be traceable to specific quotes.
8. Do NOT repeat the same insight in different words. Each must be distinct.

OUTPUT FORMAT:
Respond with a JSON array only. No markdown, no explanation, no preamble. Example:
[
  {
    "statement": "Users find the onboarding flow confusing after step 3.",
    "supportingEvidence": [
      { "quoteText": "I got stuck on the third step and didn't know what to do next", "startOffset": 145, "endOffset": 213 }
    ],
    "suggestedThemeTag": "onboarding friction",
    "suggestedProblemMapping": null,
    "confidence": "high"
  }
]`;
}

export function buildUserPrompt(params: {
	noteContent: string;
	participantName: string;
	sessionDate: string;
	researchMethod: string | null;
	existingQuotes: Array<{ text: string; startOffset: number; endOffset: number }>;
	existingProblems: Array<{ label: string }>;
}): string {
	const {
		noteContent,
		participantName,
		sessionDate,
		researchMethod,
		existingQuotes,
		existingProblems,
	} = params;

	let prompt = `RESEARCH NOTE
Participant: ${participantName}
Date: ${sessionDate}
${researchMethod ? `Method: ${researchMethod}` : ""}

--- NOTE CONTENT ---
${noteContent}
--- END NOTE CONTENT ---`;

	if (existingQuotes.length > 0) {
		prompt += `\n\nALREADY EXTRACTED QUOTES (the user has already identified these as important):
${existingQuotes.map((q) => `- "${q.text}"`).join("\n")}`;
	}

	if (existingProblems.length > 0) {
		prompt += `\n\nEXISTING PROBLEMS IN THIS PROJECT (suggest mappings only if clearly relevant):
${existingProblems.map((p) => `- ${p.label}`).join("\n")}`;
	}

	prompt +=
		"\n\nAnalyse this research note and extract structured insights. Return JSON array only.";

	return prompt;
}
