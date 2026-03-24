import { sql } from "drizzle-orm";
import { check, index, pgTable, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { mapNodes } from "./map-nodes";
import { projects } from "./projects";
import { users } from "./users";

export const mapConnections = pgTable(
	"map_connections",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		projectId: uuid("project_id")
			.notNull()
			.references(() => projects.id, { onDelete: "cascade" }),
		sourceNodeId: uuid("source_node_id")
			.notNull()
			.references(() => mapNodes.id, { onDelete: "cascade" }),
		targetNodeId: uuid("target_node_id")
			.notNull()
			.references(() => mapNodes.id, { onDelete: "cascade" }),
		createdBy: uuid("created_by")
			.notNull()
			.references(() => users.id),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("map_connections_unique").on(table.sourceNodeId, table.targetNodeId),
		index("map_connections_project_idx").on(table.projectId),
		index("map_connections_source_idx").on(table.sourceNodeId),
		index("map_connections_target_idx").on(table.targetNodeId),
		check("no_self_link", sql`source_node_id != target_node_id`),
	],
);
