import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { projects } from "./projects";

export const comments = pgTable(
	"comments",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		targetType: text("target_type", {
			enum: ["insight", "problem", "solution", "stack_item"],
		}).notNull(),
		targetId: uuid("target_id").notNull(),
		parentId: uuid("parent_id"),
		content: text("content").notNull(),
		authorId: uuid("author_id").notNull().references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("comments_target_idx").on(table.targetType, table.targetId),
		index("comments_author_idx").on(table.authorId),
		index("comments_parent_idx").on(table.parentId),
	],
);
