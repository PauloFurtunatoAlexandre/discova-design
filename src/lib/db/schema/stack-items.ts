import { index, pgTable, real, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { mapNodes } from "./map-nodes";
import { projects } from "./projects";
import { users } from "./users";

export const stackItems = pgTable(
	"stack_items",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		solutionNodeId: uuid("solution_node_id")
			.notNull()
			.references(() => mapNodes.id, { onDelete: "cascade" }),
		reachAuto: real("reach_auto"),
		reachOverride: real("reach_override"),
		impactAuto: real("impact_auto"),
		impactOverride: real("impact_override"),
		confidenceAuto: real("confidence_auto"),
		confidenceOverride: real("confidence_override"),
		effortManual: real("effort_manual"),
		effortJiraEstimate: real("effort_jira_estimate"),
		effortLinearEstimate: real("effort_linear_estimate"),
		riceScore: real("rice_score"),
		tier: text("tier", {
			enum: ["now", "next", "later", "someday"],
		}),
		lastEditedBy: uuid("last_edited_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("stack_items_solution_unique").on(table.solutionNodeId),
		index("stack_items_project_idx").on(table.projectId),
		index("stack_items_rice_idx").on(table.riceScore),
		index("stack_items_tier_idx").on(table.tier),
	],
);
