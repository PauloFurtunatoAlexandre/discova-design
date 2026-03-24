import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"

// ── Workspaces ────────────────────────────────────────────────────────
export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    logoUrl: text("logo_url"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("workspaces_slug_idx").on(table.slug),
    createdByIdx: index("workspaces_created_by_idx").on(table.createdBy),
  })
)

// ── Workspace Members ─────────────────────────────────────────────────
// Permission tier lives here. Preset override (workspace-level) also lives here.
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Permission tier — controls WHAT actions a user can take
    tier: text("tier", { enum: ["admin", "member", "viewer"] }).notNull(),
    // Workspace-level preset override — controls WHICH phases a Member can edit.
    // null = fall back to users.global_preset.
    // Only relevant when tier = "member".
    workspacePreset: text("workspace_preset", {
      enum: ["researcher", "pm", "member"],
    }),
    invitedBy: uuid("invited_by").references(() => users.id),
    inviteAcceptedAt: timestamp("invite_accepted_at", { withTimezone: true }),
    // Soft delete — set when member is removed. Triggers anonymisation job.
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Enforce one membership record per user per workspace
    uniqueMembership: uniqueIndex("workspace_members_unique_idx").on(
      table.workspaceId,
      table.userId
    ),
    workspaceIdx: index("workspace_members_workspace_idx").on(table.workspaceId),
    userIdx: index("workspace_members_user_idx").on(table.userId),
  })
)

// ── Projects ──────────────────────────────────────────────────────────
// A project = a persistent product area (e.g. "Mobile App", "Checkout Flow")
// NOT a time-boxed sprint or discovery effort.
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    workspaceIdx: index("projects_workspace_id_idx").on(table.workspaceId),
    createdByIdx: index("projects_created_by_idx").on(table.createdBy),
  })
)

// ── Project Members ───────────────────────────────────────────────────
// Per-project preset overrides. Only created when Admin explicitly sets an override.
// Absence of a row = use workspace_preset or global_preset.
export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Project-level preset override. null = use workspace or global preset.
    projectPreset: text("project_preset", {
      enum: ["researcher", "pm", "member"],
    }),
    setBy: uuid("set_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueOverride: uniqueIndex("project_members_unique_idx").on(
      table.projectId,
      table.userId
    ),
    projectIdx: index("project_members_project_idx").on(table.projectId),
    userIdx: index("project_members_user_idx").on(table.userId),
  })
)

// ── Relations ─────────────────────────────────────────────────────────
export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  creator: one(users, { fields: [workspaces.createdBy], references: [users.id] }),
  members: many(workspaceMembers),
  projects: many(projects),
}))

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceMembers.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, { fields: [workspaceMembers.userId], references: [users.id] }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  creator: one(users, { fields: [projects.createdBy], references: [users.id] }),
  members: many(projectMembers),
}))

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}))
