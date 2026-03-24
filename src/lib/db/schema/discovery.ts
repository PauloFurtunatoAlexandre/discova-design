import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { quoteObjects } from "./vault";

// ════════════════════════════════════════════════════════════════════
// PHASE 02 — ENGINE (Insight Cards)
// ════════════════════════════════════════════════════════════════════

export const insightCards = pgTable(
	"insight_cards",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		// One clear declarative sentence
		statement: text("statement").notNull(),
		// Calculated from evidence. Never user-set directly.
		// Formula: base 30% for first quote, +15% per additional quote from different note, cap 90%
		confidenceScore: real("confidence_score").notNull().default(0),
		themeTag: text("theme_tag"),
		// Whether this was AI-suggested (and then edited/accepted) or manually created
		aiAssisted: boolean("ai_assisted").notNull().default(false),
		// Attribution
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		// If AI-assisted, who accepted it
		acceptedBy: uuid("accepted_by").references(() => users.id),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		projectIdx: index("insight_cards_project_idx").on(table.projectId),
		createdByIdx: index("insight_cards_created_by_idx").on(table.createdBy),
		confidenceIdx: index("insight_cards_confidence_idx").on(table.confidenceScore),
	}),
);

// Links insight cards to their supporting quote evidence
export const insightEvidenceLinks = pgTable(
	"insight_evidence_links",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		insightId: uuid("insight_id")
			.notNull()
			.references(() => insightCards.id, { onDelete: "cascade" }),
		quoteId: uuid("quote_id")
			.notNull()
			.references(() => quoteObjects.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		uniqueLink: uniqueIndex("insight_evidence_unique_idx").on(table.insightId, table.quoteId),
		insightIdx: index("insight_evidence_insight_idx").on(table.insightId),
		quoteIdx: index("insight_evidence_quote_idx").on(table.quoteId),
	}),
);

// ════════════════════════════════════════════════════════════════════
// PHASE 03 — MAP (Opportunity Map Canvas)
// ════════════════════════════════════════════════════════════════════

export const mapProblems = pgTable(
	"map_problems",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		statement: text("statement").notNull(),
		description: text("description"),
		// Canvas position for auto-layout persistence
		canvasX: real("canvas_x"),
		canvasY: real("canvas_y"),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		projectIdx: index("map_problems_project_idx").on(table.projectId),
	}),
);

// Many-to-many: insights ↔ problems
export const insightProblemLinks = pgTable(
	"insight_problem_links",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		insightId: uuid("insight_id")
			.notNull()
			.references(() => insightCards.id, { onDelete: "cascade" }),
		problemId: uuid("problem_id")
			.notNull()
			.references(() => mapProblems.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		uniqueLink: uniqueIndex("insight_problem_unique_idx").on(table.insightId, table.problemId),
		insightIdx: index("insight_problem_insight_idx").on(table.insightId),
		problemIdx: index("insight_problem_problem_idx").on(table.problemId),
	}),
);

export const mapSolutions = pgTable(
	"map_solutions",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		statement: text("statement").notNull(),
		description: text("description"),
		// Canvas position
		canvasX: real("canvas_x"),
		canvasY: real("canvas_y"),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		deletedAt: timestamp("deleted_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		projectIdx: index("map_solutions_project_idx").on(table.projectId),
	}),
);

// Many-to-many: problems ↔ solutions
// A solution with zero problem links = orphan (soft-warned in UI)
export const problemSolutionLinks = pgTable(
	"problem_solution_links",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		problemId: uuid("problem_id")
			.notNull()
			.references(() => mapProblems.id, { onDelete: "cascade" }),
		solutionId: uuid("solution_id")
			.notNull()
			.references(() => mapSolutions.id, { onDelete: "cascade" }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		uniqueLink: uniqueIndex("problem_solution_unique_idx").on(table.problemId, table.solutionId),
		problemIdx: index("problem_solution_problem_idx").on(table.problemId),
		solutionIdx: index("problem_solution_solution_idx").on(table.solutionId),
	}),
);

// ════════════════════════════════════════════════════════════════════
// PHASE 04 — STACK (Priority Stack)
// ════════════════════════════════════════════════════════════════════

export const stackItems = pgTable(
	"stack_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		solutionId: uuid("solution_id")
			.notNull()
			.references(() => mapSolutions.id, { onDelete: "cascade" }),
		// RICE scores — auto-populated, user can override any field
		// null = not yet calculated or not yet overridden by user
		reach: real("reach"),
		reachOverridden: boolean("reach_overridden").notNull().default(false),
		impact: real("impact"),
		impactOverridden: boolean("impact_overridden").notNull().default(false),
		confidence: real("confidence"),
		confidenceOverridden: boolean("confidence_overridden").notNull().default(false),
		// Effort: from Jira/Linear history if integration connected, else user-entered
		effort: real("effort"),
		effortSource: text("effort_source", {
			enum: ["jira", "linear", "manual", "pending"],
		})
			.notNull()
			.default("pending"),
		// Calculated: (reach * impact * confidence) / effort
		riceScore: real("rice_score"),
		// Tier ranking for roadmap view
		tier: text("tier", { enum: ["now", "next", "later", "someday"] }),
		lastEditedBy: uuid("last_edited_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		projectIdx: index("stack_items_project_idx").on(table.projectId),
		solutionIdx: index("stack_items_solution_idx").on(table.solutionId),
		riceIdx: index("stack_items_rice_score_idx").on(table.riceScore),
	}),
);

// Locked snapshots — created when Share action is triggered
export const stackSnapshots = pgTable(
	"stack_snapshots",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		// Snapshot of stack items at lock time (denormalised for performance)
		snapshotData: jsonb("snapshot_data").notNull(),
		// Access control for share link
		passcode: text("passcode").notNull(),
		// Which view the sender chose to share
		shareMode: text("share_mode", {
			enum: ["stakeholder", "presentation"],
		})
			.notNull()
			.default("stakeholder"),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		// Optional expiry — not in MVP, future feature
		expiresAt: timestamp("expires_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => ({
		projectIdx: index("stack_snapshots_project_idx").on(table.projectId),
		createdByIdx: index("stack_snapshots_created_by_idx").on(table.createdBy),
	}),
);

// ── Relations ─────────────────────────────────────────────────────────
export const insightCardsRelations = relations(insightCards, ({ one, many }) => ({
	project: one(projects, { fields: [insightCards.projectId], references: [projects.id] }),
	creator: one(users, { fields: [insightCards.createdBy], references: [users.id] }),
	evidence: many(insightEvidenceLinks),
	problemLinks: many(insightProblemLinks),
}));

export const mapProblemsRelations = relations(mapProblems, ({ one, many }) => ({
	project: one(projects, { fields: [mapProblems.projectId], references: [projects.id] }),
	creator: one(users, { fields: [mapProblems.createdBy], references: [users.id] }),
	insightLinks: many(insightProblemLinks),
	solutionLinks: many(problemSolutionLinks),
}));

export const mapSolutionsRelations = relations(mapSolutions, ({ one, many }) => ({
	project: one(projects, { fields: [mapSolutions.projectId], references: [projects.id] }),
	creator: one(users, { fields: [mapSolutions.createdBy], references: [users.id] }),
	problemLinks: many(problemSolutionLinks),
	stackItem: many(stackItems),
}));

export const stackItemsRelations = relations(stackItems, ({ one }) => ({
	project: one(projects, { fields: [stackItems.projectId], references: [projects.id] }),
	solution: one(mapSolutions, { fields: [stackItems.solutionId], references: [mapSolutions.id] }),
	lastEditor: one(users, { fields: [stackItems.lastEditedBy], references: [users.id] }),
}));
