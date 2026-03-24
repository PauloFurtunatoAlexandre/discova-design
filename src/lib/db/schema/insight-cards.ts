import { boolean, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const insightCards = pgTable(
	"insight_cards",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		statement: text("statement").notNull(),
		confidenceScore: integer("confidence_score").notNull().default(0),
		themeTag: text("theme_tag"),
		isAiGenerated: boolean("is_ai_generated").notNull().default(false),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		acceptedBy: uuid("accepted_by").references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("insight_cards_project_idx").on(table.projectId),
		index("insight_cards_confidence_idx").on(table.confidenceScore),
		index("insight_cards_theme_idx").on(table.themeTag),
	],
);
