import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { projects } from "./projects";
import { users } from "./users";

export const stackSnapshots = pgTable(
	"stack_snapshots",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		lockedBy: uuid("locked_by")
			.notNull()
			.references(() => users.id),
		lockedAt: timestamp("locked_at", { withTimezone: true }).notNull(),
		snapshotData: jsonb("snapshot_data").notNull(),
		sharePasscodeHash: text("share_passcode_hash").notNull(),
		shareViewMode: text("share_view_mode", {
			enum: ["stakeholder", "presentation"],
		}).notNull(),
		shareToken: text("share_token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [uniqueIndex("stack_snapshots_token_idx").on(table.shareToken)],
);
