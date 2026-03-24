// Inferred types from Drizzle schema
// Never define DB types manually — always infer from schema

import type {
	auditLog,
	comments,
	insightCards,
	insightEvidence,
	integrations,
	mapConnections,
	mapNodes,
	notifications,
	projectMembers,
	projects,
	quotes,
	researchNotes,
	stackItems,
	stackSnapshots,
	tags,
	users,
	workspaceMembers,
	workspaces,
} from "@/lib/db/schema";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

// Select types (reading from DB)
export type User = InferSelectModel<typeof users>;
export type Workspace = InferSelectModel<typeof workspaces>;
export type WorkspaceMember = InferSelectModel<typeof workspaceMembers>;
export type Project = InferSelectModel<typeof projects>;
export type ProjectMember = InferSelectModel<typeof projectMembers>;
export type ResearchNote = InferSelectModel<typeof researchNotes>;
export type Tag = InferSelectModel<typeof tags>;
export type Quote = InferSelectModel<typeof quotes>;
export type InsightCard = InferSelectModel<typeof insightCards>;
export type InsightEvidence = InferSelectModel<typeof insightEvidence>;
export type MapNode = InferSelectModel<typeof mapNodes>;
export type MapConnection = InferSelectModel<typeof mapConnections>;
export type StackItem = InferSelectModel<typeof stackItems>;
export type StackSnapshot = InferSelectModel<typeof stackSnapshots>;
export type Comment = InferSelectModel<typeof comments>;
export type Notification = InferSelectModel<typeof notifications>;
export type Integration = InferSelectModel<typeof integrations>;
export type AuditLog = InferSelectModel<typeof auditLog>;

// Insert types (writing to DB)
export type NewUser = InferInsertModel<typeof users>;
export type NewWorkspace = InferInsertModel<typeof workspaces>;
export type NewProject = InferInsertModel<typeof projects>;
export type NewResearchNote = InferInsertModel<typeof researchNotes>;
export type NewInsightCard = InferInsertModel<typeof insightCards>;
export type NewMapNode = InferInsertModel<typeof mapNodes>;
export type NewStackItem = InferInsertModel<typeof stackItems>;

// ── Permission types ──────────────────────────────────────────────────
export type Tier = "admin" | "member" | "viewer";
export type Preset = "researcher" | "pm" | "member";
export type Phase = "vault" | "engine" | "map" | "stack" | "team";
export type Action = "read" | "write";

// ── UI-specific types ─────────────────────────────────────────────────
export type MapNodeState = "connected" | "unconnected" | "orphan-warning" | "selected" | "hover";

export type MapNodeType = "insight" | "problem" | "solution";

export type ShareMode = "stakeholder" | "presentation";

export type PhaseId = 1 | 2 | 3 | 4 | 5;

export const PHASE_META: Record<
	PhaseId,
	{
		name: string;
		action: string;
		accent: string;
		route: string;
	}
> = {
	1: { name: "Vault", action: "Store", accent: "var(--color-accent-gold)", route: "/vault" },
	2: { name: "Engine", action: "Synthesise", accent: "var(--color-accent-blue)", route: "/engine" },
	3: { name: "Map", action: "Connect", accent: "var(--color-accent-coral)", route: "/map" },
	4: { name: "Stack", action: "Decide", accent: "var(--color-accent-green)", route: "/stack" },
	5: { name: "Team", action: "Align", accent: "var(--color-accent-purple)", route: "/team" },
};
