import { relations } from "drizzle-orm/relations";
import {
	accounts,
	auditLog,
	comments,
	insightCards,
	insightEvidence,
	integrations,
	mapConnections,
	mapNodes,
	noteTags,
	notifications,
	projectMembers,
	projects,
	quotes,
	researchNotes,
	sessions,
	stackItems,
	stackSnapshots,
	tags,
	users,
	workspaceMembers,
	workspaces,
} from "./schema";

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	user: one(users, {
		fields: [workspaces.createdBy],
		references: [users.id],
	}),
	workspaceMembers: many(workspaceMembers),
	projects: many(projects),
	notifications: many(notifications),
	integrations: many(integrations),
	auditLogs: many(auditLog),
}));

export const usersRelations = relations(users, ({ many }) => ({
	workspaces: many(workspaces),
	mapNodes: many(mapNodes),
	mapConnections: many(mapConnections),
	sessions: many(sessions),
	workspaceMembers_invitedBy: many(workspaceMembers, {
		relationName: "workspaceMembers_invitedBy_users_id",
	}),
	workspaceMembers_userId: many(workspaceMembers, {
		relationName: "workspaceMembers_userId_users_id",
	}),
	projects: many(projects),
	projectMembers_setBy: many(projectMembers, {
		relationName: "projectMembers_setBy_users_id",
	}),
	projectMembers_userId: many(projectMembers, {
		relationName: "projectMembers_userId_users_id",
	}),
	researchNotes: many(researchNotes),
	quotes: many(quotes),
	insightCards_acceptedBy: many(insightCards, {
		relationName: "insightCards_acceptedBy_users_id",
	}),
	insightCards_createdBy: many(insightCards, {
		relationName: "insightCards_createdBy_users_id",
	}),
	stackItems: many(stackItems),
	stackSnapshots: many(stackSnapshots),
	comments: many(comments),
	notifications: many(notifications),
	integrations: many(integrations),
	auditLogs: many(auditLog),
	accounts: many(accounts),
}));

export const mapNodesRelations = relations(mapNodes, ({ one, many }) => ({
	user: one(users, {
		fields: [mapNodes.createdBy],
		references: [users.id],
	}),
	insightCard: one(insightCards, {
		fields: [mapNodes.insightId],
		references: [insightCards.id],
	}),
	project: one(projects, {
		fields: [mapNodes.projectId],
		references: [projects.id],
	}),
	mapConnections_sourceNodeId: many(mapConnections, {
		relationName: "mapConnections_sourceNodeId_mapNodes_id",
	}),
	mapConnections_targetNodeId: many(mapConnections, {
		relationName: "mapConnections_targetNodeId_mapNodes_id",
	}),
	stackItems: many(stackItems),
}));

export const insightCardsRelations = relations(insightCards, ({ one, many }) => ({
	mapNodes: many(mapNodes),
	user_acceptedBy: one(users, {
		fields: [insightCards.acceptedBy],
		references: [users.id],
		relationName: "insightCards_acceptedBy_users_id",
	}),
	user_createdBy: one(users, {
		fields: [insightCards.createdBy],
		references: [users.id],
		relationName: "insightCards_createdBy_users_id",
	}),
	project: one(projects, {
		fields: [insightCards.projectId],
		references: [projects.id],
	}),
	insightEvidences: many(insightEvidence),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	mapNodes: many(mapNodes),
	mapConnections: many(mapConnections),
	user: one(users, {
		fields: [projects.createdBy],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [projects.workspaceId],
		references: [workspaces.id],
	}),
	projectMembers: many(projectMembers),
	researchNotes: many(researchNotes),
	insightCards: many(insightCards),
	tags: many(tags),
	stackItems: many(stackItems),
	stackSnapshots: many(stackSnapshots),
	comments: many(comments),
	notifications: many(notifications),
}));

export const mapConnectionsRelations = relations(mapConnections, ({ one }) => ({
	user: one(users, {
		fields: [mapConnections.createdBy],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [mapConnections.projectId],
		references: [projects.id],
	}),
	mapNode_sourceNodeId: one(mapNodes, {
		fields: [mapConnections.sourceNodeId],
		references: [mapNodes.id],
		relationName: "mapConnections_sourceNodeId_mapNodes_id",
	}),
	mapNode_targetNodeId: one(mapNodes, {
		fields: [mapConnections.targetNodeId],
		references: [mapNodes.id],
		relationName: "mapConnections_targetNodeId_mapNodes_id",
	}),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
	user_invitedBy: one(users, {
		fields: [workspaceMembers.invitedBy],
		references: [users.id],
		relationName: "workspaceMembers_invitedBy_users_id",
	}),
	user_userId: one(users, {
		fields: [workspaceMembers.userId],
		references: [users.id],
		relationName: "workspaceMembers_userId_users_id",
	}),
	workspace: one(workspaces, {
		fields: [workspaceMembers.workspaceId],
		references: [workspaces.id],
	}),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, {
		fields: [projectMembers.projectId],
		references: [projects.id],
	}),
	user_setBy: one(users, {
		fields: [projectMembers.setBy],
		references: [users.id],
		relationName: "projectMembers_setBy_users_id",
	}),
	user_userId: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
		relationName: "projectMembers_userId_users_id",
	}),
}));

export const researchNotesRelations = relations(researchNotes, ({ one, many }) => ({
	user: one(users, {
		fields: [researchNotes.createdBy],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [researchNotes.projectId],
		references: [projects.id],
	}),
	quotes: many(quotes),
	noteTags: many(noteTags),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
	user: one(users, {
		fields: [quotes.createdBy],
		references: [users.id],
	}),
	researchNote: one(researchNotes, {
		fields: [quotes.noteId],
		references: [researchNotes.id],
	}),
	insightEvidences: many(insightEvidence),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	project: one(projects, {
		fields: [tags.projectId],
		references: [projects.id],
	}),
	noteTags: many(noteTags),
}));

export const insightEvidenceRelations = relations(insightEvidence, ({ one }) => ({
	insightCard: one(insightCards, {
		fields: [insightEvidence.insightId],
		references: [insightCards.id],
	}),
	quote: one(quotes, {
		fields: [insightEvidence.quoteId],
		references: [quotes.id],
	}),
}));

export const stackItemsRelations = relations(stackItems, ({ one }) => ({
	user: one(users, {
		fields: [stackItems.lastEditedBy],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [stackItems.projectId],
		references: [projects.id],
	}),
	mapNode: one(mapNodes, {
		fields: [stackItems.solutionNodeId],
		references: [mapNodes.id],
	}),
}));

export const stackSnapshotsRelations = relations(stackSnapshots, ({ one }) => ({
	user: one(users, {
		fields: [stackSnapshots.lockedBy],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [stackSnapshots.projectId],
		references: [projects.id],
	}),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
	user: one(users, {
		fields: [comments.authorId],
		references: [users.id],
	}),
	project: one(projects, {
		fields: [comments.projectId],
		references: [projects.id],
	}),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	project: one(projects, {
		fields: [notifications.projectId],
		references: [projects.id],
	}),
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [notifications.workspaceId],
		references: [workspaces.id],
	}),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
	user: one(users, {
		fields: [integrations.connectedBy],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [integrations.workspaceId],
		references: [workspaces.id],
	}),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	user: one(users, {
		fields: [auditLog.userId],
		references: [users.id],
	}),
	workspace: one(workspaces, {
		fields: [auditLog.workspaceId],
		references: [workspaces.id],
	}),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
	researchNote: one(researchNotes, {
		fields: [noteTags.noteId],
		references: [researchNotes.id],
	}),
	tag: one(tags, {
		fields: [noteTags.tagId],
		references: [tags.id],
	}),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id],
	}),
}));
