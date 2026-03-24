import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";
import { workspaces } from "./workspaces";

export const integrations = pgTable(
	"integrations",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		workspaceId: uuid("workspace_id")
			.notNull()
			.references(() => workspaces.id, { onDelete: "cascade" }),
		type: text("type", {
			enum: ["jira", "linear", "slack", "figma"],
		}).notNull(),
		config: jsonb("config").notNull().default({}),
		accessTokenEncrypted: text("access_token_encrypted"),
		refreshTokenEncrypted: text("refresh_token_encrypted"),
		tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),
		isActive: boolean("is_active").notNull().default(true),
		connectedBy: uuid("connected_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [uniqueIndex("integrations_workspace_type_idx").on(table.workspaceId, table.type)],
);
