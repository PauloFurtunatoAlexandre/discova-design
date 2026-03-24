// Inferred types from Drizzle schema
// Never define DB types manually — always infer from schema

import type { InferSelectModel, InferInsertModel } from "drizzle-orm"
import type {
  users,
  workspaces,
  workspaceMembers,
  projects,
  projectMembers,
  researchNotes,
  quoteObjects,
  insightCards,
  insightEvidenceLinks,
  mapProblems,
  mapSolutions,
  insightProblemLinks,
  problemSolutionLinks,
  stackItems,
  stackSnapshots,
} from "@/lib/db/schema"

// ── Select types (reading from DB) ───────────────────────────────────
export type User               = InferSelectModel<typeof users>
export type Workspace          = InferSelectModel<typeof workspaces>
export type WorkspaceMember    = InferSelectModel<typeof workspaceMembers>
export type Project            = InferSelectModel<typeof projects>
export type ProjectMember      = InferSelectModel<typeof projectMembers>
export type ResearchNote       = InferSelectModel<typeof researchNotes>
export type QuoteObject        = InferSelectModel<typeof quoteObjects>
export type InsightCard        = InferSelectModel<typeof insightCards>
export type InsightEvidenceLink = InferSelectModel<typeof insightEvidenceLinks>
export type MapProblem         = InferSelectModel<typeof mapProblems>
export type MapSolution        = InferSelectModel<typeof mapSolutions>
export type InsightProblemLink = InferSelectModel<typeof insightProblemLinks>
export type ProblemSolutionLink = InferSelectModel<typeof problemSolutionLinks>
export type StackItem          = InferSelectModel<typeof stackItems>
export type StackSnapshot      = InferSelectModel<typeof stackSnapshots>

// ── Insert types (writing to DB) ─────────────────────────────────────
export type NewResearchNote    = InferInsertModel<typeof researchNotes>
export type NewQuoteObject     = InferInsertModel<typeof quoteObjects>
export type NewInsightCard     = InferInsertModel<typeof insightCards>
export type NewMapProblem      = InferInsertModel<typeof mapProblems>
export type NewMapSolution     = InferInsertModel<typeof mapSolutions>
export type NewStackItem       = InferInsertModel<typeof stackItems>

// ── Permission types ──────────────────────────────────────────────────
export type Tier    = "admin" | "member" | "viewer"
export type Preset  = "researcher" | "pm" | "member"
export type Phase   = "vault" | "engine" | "map" | "stack" | "team"
export type Action  = "read" | "write"

// ── Enriched types (joined queries) ──────────────────────────────────
export type ResearchNoteWithQuotes = ResearchNote & {
  quotes: QuoteObject[]
}

export type InsightCardWithEvidence = InsightCard & {
  evidence: Array<InsightEvidenceLink & { quote: QuoteObject }>
}

export type MapNodeWithConnections = MapProblem & {
  insights: InsightCard[]
  solutions: MapSolution[]
}

export type StackItemWithSolution = StackItem & {
  solution: MapSolution & {
    problemLinks: Array<{ problem: MapProblem }>
  }
}

// ── UI-specific types ─────────────────────────────────────────────────
export type MapNodeState =
  | "connected"
  | "unconnected"
  | "orphan-warning"
  | "selected"
  | "hover"

export type MapNodeType = "insight" | "problem" | "solution"

export type ShareMode = "stakeholder" | "presentation"

export type PhaseId = 1 | 2 | 3 | 4 | 5

export const PHASE_META: Record<PhaseId, {
  name: string
  action: string
  accent: string
  route: string
}> = {
  1: { name: "Vault",  action: "Store",      accent: "var(--color-accent-gold)",   route: "/vault"  },
  2: { name: "Engine", action: "Synthesise",  accent: "var(--color-accent-blue)",   route: "/engine" },
  3: { name: "Map",    action: "Connect",     accent: "var(--color-accent-coral)",  route: "/map"    },
  4: { name: "Stack",  action: "Decide",      accent: "var(--color-accent-green)",  route: "/stack"  },
  5: { name: "Team",   action: "Align",       accent: "var(--color-accent-purple)", route: "/team"   },
}
