import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	date,
	foreignKey,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	real,
	text,
	timestamp,
	uniqueIndex,
	uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable(
	"users",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: timestamp("email_verified", { withTimezone: true, mode: "string" }),
		image: text(),
		passwordHash: text("password_hash"),
		jobTitle: text("job_title"),
		avatarUrl: text("avatar_url"),
		globalPreset: text("global_preset"),
		lockedUntil: timestamp("locked_until", { withTimezone: true, mode: "string" }),
		failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			emailIdx: uniqueIndex("users_email_idx").using(
				"btree",
				table.email.asc().nullsLast().op("text_ops"),
			),
		};
	},
);

export const workspaces = pgTable(
	"workspaces",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		logoUrl: text("logo_url"),
		createdBy: uuid("created_by").notNull(),
		isDemo: boolean("is_demo").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			slugIdx: uniqueIndex("workspaces_slug_idx").using(
				"btree",
				table.slug.asc().nullsLast().op("text_ops"),
			),
			workspacesCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "workspaces_created_by_users_id_fk",
			}),
		};
	},
);

export const mapNodes = pgTable(
	"map_nodes",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		type: text().notNull(),
		label: text().notNull(),
		description: text(),
		insightId: uuid("insight_id"),
		positionX: real("position_x").default(0).notNull(),
		positionY: real("position_y").default(0).notNull(),
		isCollapsed: boolean("is_collapsed").default(false).notNull(),
		createdBy: uuid("created_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			insightIdx: index("map_nodes_insight_idx").using(
				"btree",
				table.insightId.asc().nullsLast().op("uuid_ops"),
			),
			projectIdx: index("map_nodes_project_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
			),
			typeIdx: index("map_nodes_type_idx").using(
				"btree",
				table.type.asc().nullsLast().op("text_ops"),
			),
			mapNodesCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "map_nodes_created_by_users_id_fk",
			}),
			mapNodesInsightIdInsightCardsIdFk: foreignKey({
				columns: [table.insightId],
				foreignColumns: [insightCards.id],
				name: "map_nodes_insight_id_insight_cards_id_fk",
			}).onDelete("set null"),
			mapNodesProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "map_nodes_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const mapConnections = pgTable(
	"map_connections",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		sourceNodeId: uuid("source_node_id").notNull(),
		targetNodeId: uuid("target_node_id").notNull(),
		createdBy: uuid("created_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			projectIdx: index("map_connections_project_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
			),
			sourceIdx: index("map_connections_source_idx").using(
				"btree",
				table.sourceNodeId.asc().nullsLast().op("uuid_ops"),
			),
			targetIdx: index("map_connections_target_idx").using(
				"btree",
				table.targetNodeId.asc().nullsLast().op("uuid_ops"),
			),
			unique: uniqueIndex("map_connections_unique").using(
				"btree",
				table.sourceNodeId.asc().nullsLast().op("uuid_ops"),
				table.targetNodeId.asc().nullsLast().op("uuid_ops"),
			),
			mapConnectionsCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "map_connections_created_by_users_id_fk",
			}),
			mapConnectionsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "map_connections_project_id_projects_id_fk",
			}).onDelete("cascade"),
			mapConnectionsSourceNodeIdMapNodesIdFk: foreignKey({
				columns: [table.sourceNodeId],
				foreignColumns: [mapNodes.id],
				name: "map_connections_source_node_id_map_nodes_id_fk",
			}).onDelete("cascade"),
			mapConnectionsTargetNodeIdMapNodesIdFk: foreignKey({
				columns: [table.targetNodeId],
				foreignColumns: [mapNodes.id],
				name: "map_connections_target_node_id_map_nodes_id_fk",
			}).onDelete("cascade"),
			noSelfLink: check("no_self_link", sql`source_node_id <> target_node_id`),
		};
	},
);

export const sessions = pgTable(
	"sessions",
	{
		sessionToken: text("session_token").primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		expires: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	},
	(table) => {
		return {
			sessionsUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "sessions_user_id_users_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const workspaceMembers = pgTable(
	"workspace_members",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid("workspace_id").notNull(),
		userId: uuid("user_id").notNull(),
		tier: text().notNull(),
		workspacePreset: text("workspace_preset"),
		invitedBy: uuid("invited_by"),
		inviteAcceptedAt: timestamp("invite_accepted_at", { withTimezone: true, mode: "string" }),
		removedAt: timestamp("removed_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			tierIdx: index("workspace_members_tier_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("text_ops"),
				table.tier.asc().nullsLast().op("uuid_ops"),
			),
			uniqueActive: uniqueIndex("workspace_members_unique_active").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("uuid_ops"),
				table.userId.asc().nullsLast().op("uuid_ops"),
			),
			userIdx: index("workspace_members_user_idx").using(
				"btree",
				table.userId.asc().nullsLast().op("uuid_ops"),
			),
			workspaceIdx: index("workspace_members_workspace_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("uuid_ops"),
			),
			workspaceMembersInvitedByUsersIdFk: foreignKey({
				columns: [table.invitedBy],
				foreignColumns: [users.id],
				name: "workspace_members_invited_by_users_id_fk",
			}),
			workspaceMembersUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "workspace_members_user_id_users_id_fk",
			}).onDelete("cascade"),
			workspaceMembersWorkspaceIdWorkspacesIdFk: foreignKey({
				columns: [table.workspaceId],
				foreignColumns: [workspaces.id],
				name: "workspace_members_workspace_id_workspaces_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const projects = pgTable(
	"projects",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid("workspace_id").notNull(),
		name: text().notNull(),
		slug: text().notNull(),
		description: text(),
		createdBy: uuid("created_by").notNull(),
		archivedAt: timestamp("archived_at", { withTimezone: true, mode: "string" }),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			workspaceIdx: index("projects_workspace_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("uuid_ops"),
			),
			workspaceSlugIdx: uniqueIndex("projects_workspace_slug_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("text_ops"),
				table.slug.asc().nullsLast().op("text_ops"),
			),
			projectsCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "projects_created_by_users_id_fk",
			}),
			projectsWorkspaceIdWorkspacesIdFk: foreignKey({
				columns: [table.workspaceId],
				foreignColumns: [workspaces.id],
				name: "projects_workspace_id_workspaces_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const projectMembers = pgTable(
	"project_members",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		userId: uuid("user_id").notNull(),
		projectPreset: text("project_preset"),
		setBy: uuid("set_by"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			unique: uniqueIndex("project_members_unique").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
				table.userId.asc().nullsLast().op("uuid_ops"),
			),
			projectMembersProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "project_members_project_id_projects_id_fk",
			}).onDelete("cascade"),
			projectMembersSetByUsersIdFk: foreignKey({
				columns: [table.setBy],
				foreignColumns: [users.id],
				name: "project_members_set_by_users_id_fk",
			}),
			projectMembersUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "project_members_user_id_users_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const researchNotes = pgTable(
	"research_notes",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		participantName: text("participant_name").notNull(),
		sessionDate: date("session_date").default(sql`CURRENT_DATE`).notNull(),
		rawContent: text("raw_content").notNull(),
		researchMethod: text("research_method"),
		userSegment: text("user_segment"),
		emotionalTone: text("emotional_tone"),
		assumptionsTested: text("assumptions_tested"),
		followUpNeeded: boolean("follow_up_needed").default(false).notNull(),
		sessionRecordingUrl: text("session_recording_url"),
		createdBy: uuid("created_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		searchVector: text("search_vector"),
	},
	(table) => {
		return {
			createdByIdx: index("research_notes_created_by_idx").using(
				"btree",
				table.createdBy.asc().nullsLast().op("uuid_ops"),
			),
			followUpIdx: index("research_notes_follow_up_idx").using(
				"btree",
				table.followUpNeeded.asc().nullsLast().op("bool_ops"),
			),
			methodIdx: index("research_notes_method_idx").using(
				"btree",
				table.researchMethod.asc().nullsLast().op("text_ops"),
			),
			projectDateIdx: index("research_notes_project_date_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
				table.sessionDate.asc().nullsLast().op("date_ops"),
			),
			projectIdx: index("research_notes_project_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
			),
			researchNotesCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "research_notes_created_by_users_id_fk",
			}),
			researchNotesProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "research_notes_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const quotes = pgTable(
	"quotes",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		noteId: uuid("note_id").notNull(),
		text: text().notNull(),
		startOffset: integer("start_offset").notNull(),
		endOffset: integer("end_offset").notNull(),
		isStale: boolean("is_stale").default(false).notNull(),
		createdBy: uuid("created_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			noteIdx: index("quotes_note_idx").using(
				"btree",
				table.noteId.asc().nullsLast().op("uuid_ops"),
			),
			quotesCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "quotes_created_by_users_id_fk",
			}),
			quotesNoteIdResearchNotesIdFk: foreignKey({
				columns: [table.noteId],
				foreignColumns: [researchNotes.id],
				name: "quotes_note_id_research_notes_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const insightCards = pgTable(
	"insight_cards",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		statement: text().notNull(),
		confidenceScore: integer("confidence_score").default(0).notNull(),
		themeTag: text("theme_tag"),
		isAiGenerated: boolean("is_ai_generated").default(false).notNull(),
		createdBy: uuid("created_by").notNull(),
		acceptedBy: uuid("accepted_by"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			confidenceIdx: index("insight_cards_confidence_idx").using(
				"btree",
				table.confidenceScore.asc().nullsLast().op("int4_ops"),
			),
			projectIdx: index("insight_cards_project_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
			),
			themeIdx: index("insight_cards_theme_idx").using(
				"btree",
				table.themeTag.asc().nullsLast().op("text_ops"),
			),
			insightCardsAcceptedByUsersIdFk: foreignKey({
				columns: [table.acceptedBy],
				foreignColumns: [users.id],
				name: "insight_cards_accepted_by_users_id_fk",
			}),
			insightCardsCreatedByUsersIdFk: foreignKey({
				columns: [table.createdBy],
				foreignColumns: [users.id],
				name: "insight_cards_created_by_users_id_fk",
			}),
			insightCardsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "insight_cards_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const tags = pgTable(
	"tags",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		name: text().notNull(),
	},
	(table) => {
		return {
			projectNameIdx: uniqueIndex("tags_project_name_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("text_ops"),
				table.name.asc().nullsLast().op("text_ops"),
			),
			tagsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "tags_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const insightEvidence = pgTable(
	"insight_evidence",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		insightId: uuid("insight_id").notNull(),
		quoteId: uuid("quote_id").notNull(),
	},
	(table) => {
		return {
			unique: uniqueIndex("insight_evidence_unique").using(
				"btree",
				table.insightId.asc().nullsLast().op("uuid_ops"),
				table.quoteId.asc().nullsLast().op("uuid_ops"),
			),
			insightEvidenceInsightIdInsightCardsIdFk: foreignKey({
				columns: [table.insightId],
				foreignColumns: [insightCards.id],
				name: "insight_evidence_insight_id_insight_cards_id_fk",
			}).onDelete("cascade"),
			insightEvidenceQuoteIdQuotesIdFk: foreignKey({
				columns: [table.quoteId],
				foreignColumns: [quotes.id],
				name: "insight_evidence_quote_id_quotes_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const stackItems = pgTable(
	"stack_items",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		solutionNodeId: uuid("solution_node_id").notNull(),
		reachAuto: real("reach_auto"),
		reachOverride: real("reach_override"),
		impactAuto: real("impact_auto"),
		impactOverride: real("impact_override"),
		confidenceAuto: real("confidence_auto"),
		confidenceOverride: real("confidence_override"),
		effortManual: real("effort_manual"),
		effortJiraEstimate: real("effort_jira_estimate"),
		effortLinearEstimate: real("effort_linear_estimate"),
		riceScore: real("rice_score"),
		tier: text(),
		lastEditedBy: uuid("last_edited_by"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			projectIdx: index("stack_items_project_idx").using(
				"btree",
				table.projectId.asc().nullsLast().op("uuid_ops"),
			),
			riceIdx: index("stack_items_rice_idx").using(
				"btree",
				table.riceScore.asc().nullsLast().op("float4_ops"),
			),
			solutionUnique: uniqueIndex("stack_items_solution_unique").using(
				"btree",
				table.solutionNodeId.asc().nullsLast().op("uuid_ops"),
			),
			tierIdx: index("stack_items_tier_idx").using(
				"btree",
				table.tier.asc().nullsLast().op("text_ops"),
			),
			stackItemsLastEditedByUsersIdFk: foreignKey({
				columns: [table.lastEditedBy],
				foreignColumns: [users.id],
				name: "stack_items_last_edited_by_users_id_fk",
			}),
			stackItemsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "stack_items_project_id_projects_id_fk",
			}).onDelete("cascade"),
			stackItemsSolutionNodeIdMapNodesIdFk: foreignKey({
				columns: [table.solutionNodeId],
				foreignColumns: [mapNodes.id],
				name: "stack_items_solution_node_id_map_nodes_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const stackSnapshots = pgTable(
	"stack_snapshots",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		lockedBy: uuid("locked_by").notNull(),
		lockedAt: timestamp("locked_at", { withTimezone: true, mode: "string" }).notNull(),
		snapshotData: jsonb("snapshot_data").notNull(),
		sharePasscodeHash: text("share_passcode_hash").notNull(),
		shareViewMode: text("share_view_mode").notNull(),
		shareToken: text("share_token").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			tokenIdx: uniqueIndex("stack_snapshots_token_idx").using(
				"btree",
				table.shareToken.asc().nullsLast().op("text_ops"),
			),
			stackSnapshotsLockedByUsersIdFk: foreignKey({
				columns: [table.lockedBy],
				foreignColumns: [users.id],
				name: "stack_snapshots_locked_by_users_id_fk",
			}),
			stackSnapshotsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "stack_snapshots_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const comments = pgTable(
	"comments",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		projectId: uuid("project_id").notNull(),
		targetType: text("target_type").notNull(),
		targetId: uuid("target_id").notNull(),
		parentId: uuid("parent_id"),
		content: text().notNull(),
		authorId: uuid("author_id").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			authorIdx: index("comments_author_idx").using(
				"btree",
				table.authorId.asc().nullsLast().op("uuid_ops"),
			),
			parentIdx: index("comments_parent_idx").using(
				"btree",
				table.parentId.asc().nullsLast().op("uuid_ops"),
			),
			targetIdx: index("comments_target_idx").using(
				"btree",
				table.targetType.asc().nullsLast().op("uuid_ops"),
				table.targetId.asc().nullsLast().op("text_ops"),
			),
			commentsAuthorIdUsersIdFk: foreignKey({
				columns: [table.authorId],
				foreignColumns: [users.id],
				name: "comments_author_id_users_id_fk",
			}),
			commentsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "comments_project_id_projects_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const notifications = pgTable(
	"notifications",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		userId: uuid("user_id").notNull(),
		type: text().notNull(),
		title: text().notNull(),
		body: text(),
		targetType: text("target_type"),
		targetId: uuid("target_id"),
		workspaceId: uuid("workspace_id").notNull(),
		projectId: uuid("project_id"),
		isRead: boolean("is_read").default(false).notNull(),
		emailSent: boolean("email_sent").default(false).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			userCreatedIdx: index("notifications_user_created_idx").using(
				"btree",
				table.userId.asc().nullsLast().op("timestamptz_ops"),
				table.createdAt.asc().nullsLast().op("uuid_ops"),
			),
			userReadIdx: index("notifications_user_read_idx").using(
				"btree",
				table.userId.asc().nullsLast().op("uuid_ops"),
				table.isRead.asc().nullsLast().op("bool_ops"),
			),
			notificationsProjectIdProjectsIdFk: foreignKey({
				columns: [table.projectId],
				foreignColumns: [projects.id],
				name: "notifications_project_id_projects_id_fk",
			}).onDelete("cascade"),
			notificationsUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "notifications_user_id_users_id_fk",
			}).onDelete("cascade"),
			notificationsWorkspaceIdWorkspacesIdFk: foreignKey({
				columns: [table.workspaceId],
				foreignColumns: [workspaces.id],
				name: "notifications_workspace_id_workspaces_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const integrations = pgTable(
	"integrations",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid("workspace_id").notNull(),
		type: text().notNull(),
		config: jsonb().default({}).notNull(),
		accessTokenEncrypted: text("access_token_encrypted"),
		refreshTokenEncrypted: text("refresh_token_encrypted"),
		tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true, mode: "string" }),
		isActive: boolean("is_active").default(true).notNull(),
		connectedBy: uuid("connected_by").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			workspaceTypeIdx: uniqueIndex("integrations_workspace_type_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("text_ops"),
				table.type.asc().nullsLast().op("text_ops"),
			),
			integrationsConnectedByUsersIdFk: foreignKey({
				columns: [table.connectedBy],
				foreignColumns: [users.id],
				name: "integrations_connected_by_users_id_fk",
			}),
			integrationsWorkspaceIdWorkspacesIdFk: foreignKey({
				columns: [table.workspaceId],
				foreignColumns: [workspaces.id],
				name: "integrations_workspace_id_workspaces_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const auditLog = pgTable(
	"audit_log",
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid("workspace_id").notNull(),
		userId: uuid("user_id"),
		action: text().notNull(),
		targetType: text("target_type").notNull(),
		targetId: uuid("target_id").notNull(),
		metadata: jsonb(),
		ipAddress: text("ip_address"),
		createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
			.defaultNow()
			.notNull(),
	},
	(table) => {
		return {
			createdIdx: index("audit_log_created_idx").using(
				"btree",
				table.createdAt.asc().nullsLast().op("timestamptz_ops"),
			),
			workspaceActionIdx: index("audit_log_workspace_action_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("uuid_ops"),
				table.action.asc().nullsLast().op("text_ops"),
			),
			workspaceIdx: index("audit_log_workspace_idx").using(
				"btree",
				table.workspaceId.asc().nullsLast().op("uuid_ops"),
			),
			auditLogUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "audit_log_user_id_users_id_fk",
			}),
			auditLogWorkspaceIdWorkspacesIdFk: foreignKey({
				columns: [table.workspaceId],
				foreignColumns: [workspaces.id],
				name: "audit_log_workspace_id_workspaces_id_fk",
			}).onDelete("cascade"),
		};
	},
);

export const noteTags = pgTable(
	"note_tags",
	{
		noteId: uuid("note_id").notNull(),
		tagId: uuid("tag_id").notNull(),
	},
	(table) => {
		return {
			noteTagsNoteIdResearchNotesIdFk: foreignKey({
				columns: [table.noteId],
				foreignColumns: [researchNotes.id],
				name: "note_tags_note_id_research_notes_id_fk",
			}).onDelete("cascade"),
			noteTagsTagIdTagsIdFk: foreignKey({
				columns: [table.tagId],
				foreignColumns: [tags.id],
				name: "note_tags_tag_id_tags_id_fk",
			}).onDelete("cascade"),
			noteTagsNoteIdTagIdPk: primaryKey({
				columns: [table.noteId, table.tagId],
				name: "note_tags_note_id_tag_id_pk",
			}),
		};
	},
);

export const verificationTokens = pgTable(
	"verification_tokens",
	{
		identifier: text().notNull(),
		token: text().notNull(),
		expires: timestamp({ withTimezone: true, mode: "string" }).notNull(),
	},
	(table) => {
		return {
			verificationTokensIdentifierTokenPk: primaryKey({
				columns: [table.identifier, table.token],
				name: "verification_tokens_identifier_token_pk",
			}),
		};
	},
);

export const accounts = pgTable(
	"accounts",
	{
		userId: uuid("user_id").notNull(),
		type: text().notNull(),
		provider: text().notNull(),
		providerAccountId: text("provider_account_id").notNull(),
		refreshToken: text("refresh_token"),
		accessToken: text("access_token"),
		expiresAt: integer("expires_at"),
		tokenType: text("token_type"),
		scope: text(),
		idToken: text("id_token"),
		sessionState: text("session_state"),
	},
	(table) => {
		return {
			accountsUserIdUsersIdFk: foreignKey({
				columns: [table.userId],
				foreignColumns: [users.id],
				name: "accounts_user_id_users_id_fk",
			}).onDelete("cascade"),
			accountsProviderProviderAccountIdPk: primaryKey({
				columns: [table.provider, table.providerAccountId],
				name: "accounts_provider_provider_account_id_pk",
			}),
		};
	},
);
