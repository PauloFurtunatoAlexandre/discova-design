import { relations } from "drizzle-orm";
import { auditLog } from "./audit-log";
import { accounts, sessions } from "./auth";
import { comments } from "./comments";
import { insightCards } from "./insight-cards";
import { insightEvidence } from "./insight-evidence";
import { integrations } from "./integrations";
import { mapConnections } from "./map-connections";
import { mapNodes } from "./map-nodes";
import { noteTags } from "./note-tags";
import { notifications } from "./notifications";
import { presence } from "./presence";
import { projectMembers } from "./project-members";
import { projects } from "./projects";
import { quotes } from "./quotes";
import { researchNotes } from "./research-notes";
import { stackItems } from "./stack-items";
import { stackSnapshots } from "./stack-snapshots";
import { tags } from "./tags";
import { users } from "./users";
import { workspaceMembers } from "./workspace-members";
import { workspaces } from "./workspaces";

export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	workspaceMemberships: many(workspaceMembers, { relationName: "memberUser" }),
	invitedMembers: many(workspaceMembers, { relationName: "inviter" }),
	projectMemberships: many(projectMembers, { relationName: "projectMemberUser" }),
	presetSetMembers: many(projectMembers, { relationName: "presetSetter" }),
	createdWorkspaces: many(workspaces),
	createdProjects: many(projects),
	createdNotes: many(researchNotes),
	createdInsights: many(insightCards, { relationName: "insightCreator" }),
	acceptedInsights: many(insightCards, { relationName: "insightAcceptor" }),
	createdQuotes: many(quotes),
	notifications: many(notifications),
	auditLogs: many(auditLog),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
	createdBy: one(users, { fields: [workspaces.createdBy], references: [users.id] }),
	members: many(workspaceMembers),
	projects: many(projects),
	integrations: many(integrations),
	notifications: many(notifications),
	auditLogs: many(auditLog),
}));

export const workspaceMembersRelations = relations(workspaceMembers, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [workspaceMembers.workspaceId],
		references: [workspaces.id],
	}),
	user: one(users, {
		fields: [workspaceMembers.userId],
		references: [users.id],
		relationName: "memberUser",
	}),
	inviter: one(users, {
		fields: [workspaceMembers.invitedBy],
		references: [users.id],
		relationName: "inviter",
	}),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
	workspace: one(workspaces, { fields: [projects.workspaceId], references: [workspaces.id] }),
	createdBy: one(users, { fields: [projects.createdBy], references: [users.id] }),
	members: many(projectMembers),
	notes: many(researchNotes),
	insightCards: many(insightCards),
	mapNodes: many(mapNodes),
	stackItems: many(stackItems),
	stackSnapshots: many(stackSnapshots),
	comments: many(comments),
	notifications: many(notifications),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
	project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
	user: one(users, {
		fields: [projectMembers.userId],
		references: [users.id],
		relationName: "projectMemberUser",
	}),
	setBy: one(users, {
		fields: [projectMembers.setBy],
		references: [users.id],
		relationName: "presetSetter",
	}),
}));

export const researchNotesRelations = relations(researchNotes, ({ one, many }) => ({
	project: one(projects, { fields: [researchNotes.projectId], references: [projects.id] }),
	createdBy: one(users, { fields: [researchNotes.createdBy], references: [users.id] }),
	noteTags: many(noteTags),
	quotes: many(quotes),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
	project: one(projects, { fields: [tags.projectId], references: [projects.id] }),
	noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
	note: one(researchNotes, { fields: [noteTags.noteId], references: [researchNotes.id] }),
	tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
	note: one(researchNotes, { fields: [quotes.noteId], references: [researchNotes.id] }),
	createdBy: one(users, { fields: [quotes.createdBy], references: [users.id] }),
	insightEvidence: many(insightEvidence),
}));

export const insightCardsRelations = relations(insightCards, ({ one, many }) => ({
	project: one(projects, { fields: [insightCards.projectId], references: [projects.id] }),
	createdBy: one(users, {
		fields: [insightCards.createdBy],
		references: [users.id],
		relationName: "insightCreator",
	}),
	acceptedBy: one(users, {
		fields: [insightCards.acceptedBy],
		references: [users.id],
		relationName: "insightAcceptor",
	}),
	evidence: many(insightEvidence),
	mapNodes: many(mapNodes),
}));

export const insightEvidenceRelations = relations(insightEvidence, ({ one }) => ({
	insight: one(insightCards, {
		fields: [insightEvidence.insightId],
		references: [insightCards.id],
	}),
	quote: one(quotes, { fields: [insightEvidence.quoteId], references: [quotes.id] }),
}));

export const mapNodesRelations = relations(mapNodes, ({ one, many }) => ({
	project: one(projects, { fields: [mapNodes.projectId], references: [projects.id] }),
	createdBy: one(users, { fields: [mapNodes.createdBy], references: [users.id] }),
	insight: one(insightCards, { fields: [mapNodes.insightId], references: [insightCards.id] }),
	outgoingConnections: many(mapConnections, { relationName: "sourceConnections" }),
	incomingConnections: many(mapConnections, { relationName: "targetConnections" }),
	stackItem: many(stackItems),
}));

export const mapConnectionsRelations = relations(mapConnections, ({ one }) => ({
	project: one(projects, { fields: [mapConnections.projectId], references: [projects.id] }),
	createdBy: one(users, { fields: [mapConnections.createdBy], references: [users.id] }),
	sourceNode: one(mapNodes, {
		fields: [mapConnections.sourceNodeId],
		references: [mapNodes.id],
		relationName: "sourceConnections",
	}),
	targetNode: one(mapNodes, {
		fields: [mapConnections.targetNodeId],
		references: [mapNodes.id],
		relationName: "targetConnections",
	}),
}));

export const stackItemsRelations = relations(stackItems, ({ one }) => ({
	project: one(projects, { fields: [stackItems.projectId], references: [projects.id] }),
	solutionNode: one(mapNodes, {
		fields: [stackItems.solutionNodeId],
		references: [mapNodes.id],
	}),
	lastEditedBy: one(users, { fields: [stackItems.lastEditedBy], references: [users.id] }),
}));

export const stackSnapshotsRelations = relations(stackSnapshots, ({ one }) => ({
	project: one(projects, { fields: [stackSnapshots.projectId], references: [projects.id] }),
	lockedBy: one(users, { fields: [stackSnapshots.lockedBy], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
	project: one(projects, { fields: [comments.projectId], references: [projects.id] }),
	author: one(users, { fields: [comments.authorId], references: [users.id] }),
	parent: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "commentReplies",
	}),
	replies: many(comments, { relationName: "commentReplies" }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id] }),
	workspace: one(workspaces, {
		fields: [notifications.workspaceId],
		references: [workspaces.id],
	}),
	project: one(projects, { fields: [notifications.projectId], references: [projects.id] }),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [integrations.workspaceId],
		references: [workspaces.id],
	}),
	connectedBy: one(users, { fields: [integrations.connectedBy], references: [users.id] }),
}));

export const presenceRelations = relations(presence, ({ one }) => ({
	project: one(projects, { fields: [presence.projectId], references: [projects.id] }),
	user: one(users, { fields: [presence.userId], references: [users.id] }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
	workspace: one(workspaces, { fields: [auditLog.workspaceId], references: [workspaces.id] }),
	user: one(users, { fields: [auditLog.userId], references: [users.id] }),
}));
