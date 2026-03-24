import { boolean, index, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { insightCards } from "./insight-cards";
import { projects } from "./projects";
import { users } from "./users";

export const mapNodes = pgTable(
	"map_nodes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		type: text("type", {
			enum: ["insight", "problem", "solution"],
		}).notNull(),
		label: text("label").notNull(),
		description: text("description"),
		insightId: uuid("insight_id").references(() => insightCards.id, {
			onDelete: "set null",
		}),
		positionX: real("position_x").notNull().default(0),
		positionY: real("position_y").notNull().default(0),
		isCollapsed: boolean("is_collapsed").notNull().default(false),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("map_nodes_project_idx").on(table.projectId),
		index("map_nodes_type_idx").on(table.type),
		index("map_nodes_insight_idx").on(table.insightId),
	],
);
