import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  index,
  jsonb,
} from "drizzle-orm/pg-core"
import { relations } from "drizzle-orm"
import { users } from "./users"
import { projects } from "./projects"

// ── Research Notes (Phase 01 — Vault) ────────────────────────────────
export const researchNotes = pgTable(
  "research_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // Title is optional — fallback to first 80 chars of rawNotes in UI
    title: text("title"),
    // Required fields from the 3-step wizard
    participantSource: text("participant_source").notNull(),
    sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
    rawNotes: text("raw_notes").notNull(),
    // Optional metadata
    researchMethod: text("research_method", {
      enum: ["interview", "survey", "usability_test", "observation", "other"],
    }),
    userSegment: text("user_segment"),
    emotionalTone: text("emotional_tone", {
      enum: ["frustrated", "delighted", "neutral", "mixed"],
    }),
    assumptionsTested: text("assumptions_tested"),
    followUpNeeded: boolean("follow_up_needed").notNull().default(false),
    sessionRecordingUrl: text("session_recording_url"),
    customTags: text("custom_tags").array().notNull().default([]),
    // Attribution — preserved even after member removal (display set to "Former member")
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    // Soft delete
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("research_notes_project_idx").on(table.projectId),
    createdByIdx: index("research_notes_created_by_idx").on(table.createdBy),
    sessionDateIdx: index("research_notes_session_date_idx").on(table.sessionDate),
    followUpIdx: index("research_notes_follow_up_idx").on(table.followUpNeeded),
    // Full-text search index on raw notes + title
    // Generated via migration: CREATE INDEX ... USING gin(to_tsvector(...))
  })
)

// ── Quote Objects ─────────────────────────────────────────────────────
// Created via highlight → extract interaction in the note document view.
// These are the atomic evidence units that feed insight confidence scores.
export const quoteObjects = pgTable(
  "quote_objects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    noteId: uuid("note_id")
      .notNull()
      .references(() => researchNotes.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    // The verbatim text
    text: text("text").notNull(),
    // Position in the source note for highlight rendering
    startOffset: integer("start_offset").notNull(),
    endOffset: integer("end_offset").notNull(),
    // Optional analyst annotation
    annotation: text("annotation"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    noteIdx: index("quote_objects_note_idx").on(table.noteId),
    projectIdx: index("quote_objects_project_idx").on(table.projectId),
  })
)

// ── Relations ─────────────────────────────────────────────────────────
export const researchNotesRelations = relations(researchNotes, ({ one, many }) => ({
  project: one(projects, {
    fields: [researchNotes.projectId],
    references: [projects.id],
  }),
  creator: one(users, { fields: [researchNotes.createdBy], references: [users.id] }),
  quotes: many(quoteObjects),
}))

export const quoteObjectsRelations = relations(quoteObjects, ({ one }) => ({
  note: one(researchNotes, { fields: [quoteObjects.noteId], references: [researchNotes.id] }),
  project: one(projects, { fields: [quoteObjects.projectId], references: [projects.id] }),
  creator: one(users, { fields: [quoteObjects.createdBy], references: [users.id] }),
}))
