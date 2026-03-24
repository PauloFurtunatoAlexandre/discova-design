import { pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const tags = pgTable(
	"tags",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		name: text("name").notNull(),
	},
	(table) => [uniqueIndex("tags_project_name_idx").on(table.projectId, table.name)],
);
