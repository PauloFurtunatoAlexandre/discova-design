"use server"

import { db } from "@/lib/db"
import { users, workspaceMembers, projectMembers } from "@/lib/db/schema"
import { and, eq, isNull } from "drizzle-orm"

export type Preset = "researcher" | "pm" | "member"
export type Tier = "admin" | "member" | "viewer"
export type Phase = "vault" | "engine" | "map" | "stack" | "team"
export type Action = "read" | "write"

// ── Phase access matrix ───────────────────────────────────────────────
// What each preset can do per phase
const PHASE_ACCESS: Record<Preset, Record<Phase, Action[]>> = {
  researcher: {
    vault:  ["read", "write"],
    engine: ["read", "write"],
    map:    ["read", "write"],
    stack:  ["read"],
    team:   ["read"],
  },
  pm: {
    vault:  ["read"],
    engine: ["read"],
    map:    ["read", "write"],
    stack:  ["read", "write"],
    team:   ["read", "write"],
  },
  member: {
    vault:  ["read", "write"],
    engine: ["read", "write"],
    map:    ["read", "write"],
    stack:  ["read", "write"],
    team:   ["read", "write"],
  },
}

// ── Preset resolution ─────────────────────────────────────────────────
// Precedence: project_preset > workspace_preset > global_preset > NO_ACCESS
// Never default null to "member" — null = NO_ACCESS
export async function resolvePreset(
  userId: string,
  projectId: string,
  workspaceId: string
): Promise<Preset | "no_access"> {
  // 1. Check project-level override
  const projectOverride = await db.query.projectMembers.findFirst({
    where: and(
      eq(projectMembers.userId, userId),
      eq(projectMembers.projectId, projectId)
    ),
    columns: { projectPreset: true },
  })

  if (projectOverride?.projectPreset) {
    return projectOverride.projectPreset
  }

  // 2. Check workspace-level override
  const workspaceOverride = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
      isNull(workspaceMembers.removedAt) // exclude removed members
    ),
    columns: { workspacePreset: true, tier: true },
  })

  // Admins always get full access regardless of preset
  if (workspaceOverride?.tier === "admin") return "member"
  // Viewers are always read-only — preset doesn't apply
  if (workspaceOverride?.tier === "viewer") return "no_access"

  if (workspaceOverride?.workspacePreset) {
    return workspaceOverride.workspacePreset
  }

  // 3. Check global preset on user record
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { globalPreset: true },
  })

  if (user?.globalPreset) {
    return user.globalPreset
  }

  // 4. No preset assigned — NO_ACCESS
  return "no_access"
}

// ── Permission check helper ───────────────────────────────────────────
// Usage: if (!can(preset, "vault", "write")) return { error: "Forbidden" }
export function can(
  preset: Preset | "no_access",
  phase: Phase,
  action: Action
): boolean {
  if (preset === "no_access") return false
  return PHASE_ACCESS[preset][phase].includes(action)
}

// ── Tier check helper ─────────────────────────────────────────────────
// Usage: if (!isAdmin(tier)) return { error: "Forbidden" }
export async function getMemberTier(
  userId: string,
  workspaceId: string
): Promise<Tier | null> {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.workspaceId, workspaceId),
      isNull(workspaceMembers.removedAt)
    ),
    columns: { tier: true },
  })
  return membership?.tier ?? null
}

export function isAdmin(tier: Tier | null): boolean {
  return tier === "admin"
}
