import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";

export const workspaceMembers = pgTable(
	"workspace_members",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: uuid("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		tier: text("tier", {
			enum: ["admin", "member", "viewer"],
		}).notNull(),
		workspacePreset: text("workspace_preset", {
			enum: ["researcher", "pm", "member"],
		}),
		invitedBy: uuid("invited_by").references(() => users.id),
		inviteAcceptedAt: timestamp("invite_accepted_at", { withTimezone: true }),
		removedAt: timestamp("removed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("workspace_members_unique_active").on(table.workspaceId, table.userId),
		index("workspace_members_workspace_idx").on(table.workspaceId),
		index("workspace_members_user_idx").on(table.userId),
		index("workspace_members_tier_idx").on(table.workspaceId, table.tier),
	],
);
