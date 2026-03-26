import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const presence = pgTable(
	"presence",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		phase: text("phase", {
			enum: ["vault", "engine", "map", "stack", "team"],
		}),
		lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("presence_project_idx").on(table.projectId),
		uniqueIndex("presence_user_project_idx").on(table.userId, table.projectId),
	],
);
