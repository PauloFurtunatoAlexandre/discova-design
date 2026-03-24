// RICE score calculation for Stack items
// Formula: (Reach × Impact × Confidence) / Effort
// All four fields auto-suggested — user can override any.

export interface RiceInputs {
  reach:      number | null
  impact:     number | null  // 0.25 | 0.5 | 1 | 2 | 3
  confidence: number | null  // 0–1 (decimal, not percentage)
  effort:     number | null  // person-weeks
}

/**
 * Calculate RICE score. Returns null if any required field is missing.
 * Effort = 0 is invalid (would produce infinity) — treat as null.
 */
export function calculateRiceScore(inputs: RiceInputs): number | null {
  const { reach, impact, confidence, effort } = inputs
  if (
    reach == null ||
    impact == null ||
    confidence == null ||
    effort == null ||
    effort <= 0
  ) {
    return null
  }
  return (reach * impact * confidence) / effort
}

/**
 * Format RICE score for display — round to 1 decimal place.
 * Returns "—" if null (incomplete inputs).
 */
export function formatRiceScore(score: number | null): string {
  if (score == null) return "—"
  return score.toFixed(1)
}

// Valid Impact values per RICE framework
export const IMPACT_OPTIONS = [
  { label: "Minimal", value: 0.25 },
  { label: "Low",     value: 0.5  },
  { label: "Medium",  value: 1.0  },
  { label: "High",    value: 2.0  },
  { label: "Massive", value: 3.0  },
] as const

export type ImpactValue = (typeof IMPACT_OPTIONS)[number]["value"]
