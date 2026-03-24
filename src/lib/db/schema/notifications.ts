import { boolean, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";
import { workspaces } from "./workspaces";

export const notifications = pgTable(
	"notifications",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		type: text("type", {
			enum: [
				"mention",
				"insight_validated",
				"priority_changed",
				"invite_received",
				"comment_reply",
			],
		}).notNull(),
		title: text("title").notNull(),
		body: text("body"),
		targetType: text("target_type"),
		targetId: uuid("target_id"),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
		isRead: boolean("is_read").notNull().default(false),
		emailSent: boolean("email_sent").notNull().default(false),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("notifications_user_read_idx").on(table.userId, table.isRead),
		index("notifications_user_created_idx").on(table.userId, table.createdAt),
	],
);
