import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";

export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		userId: uuid("user_id").references(() => users.id),
		action: text("action").notNull(),
		targetType: text("target_type").notNull(),
		targetId: uuid("target_id").notNull(),
		metadata: jsonb("metadata"),
		ipAddress: text("ip_address"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("audit_log_workspace_idx").on(table.workspaceId),
		index("audit_log_workspace_action_idx").on(table.workspaceId, table.action),
		index("audit_log_user_idx").on(table.userId),
		index("audit_log_created_idx").on(table.createdAt),
	],
);
