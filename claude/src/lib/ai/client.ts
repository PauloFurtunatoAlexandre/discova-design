import Anthropic from "@anthropic-ai/sdk"

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY environment variable is required")
}

// Singleton — one client for the whole app
declare global {
  // eslint-disable-next-line no-var
  var __anthropic: Anthropic | undefined
}

export const anthropic = globalThis.__anthropic ?? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

if (process.env.NODE_ENV !== "production") {
  globalThis.__anthropic = anthropic
}

// Always use this model — never hardcode a different one in feature files
export const AI_MODEL = "claude-sonnet-4-20250514" as const

// Standard token limits per use case
export const TOKEN_LIMITS = {
  insightSynthesis: 1500,    // Per-note AI analysis
  batchSynthesis: 4000,      // Multi-note synthesis job
  evidenceSummary: 800,      // Stakeholder evidence summary per priority
} as const
