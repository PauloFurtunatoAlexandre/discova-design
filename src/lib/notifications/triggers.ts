import { db } from "@/lib/db";
import { projects, users, workspaceMembers } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { CommentReplyEmail } from "@/lib/email/templates/comment-reply";
import { InviteMemberEmail } from "@/lib/email/templates/invite-member";
import { MentionNotificationEmail } from "@/lib/email/templates/mention-notification";
import { PriorityChangedEmail } from "@/lib/email/templates/priority-changed";
import { logger } from "@/lib/logger";
import { createNotification } from "@/lib/queries/notifications";
import { and, eq, isNull, ne } from "drizzle-orm";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getProjectName(projectId: string): Promise<string> {
	const [project] = await db
		.select({ name: projects.name })
		.from(projects)
		.where(eq(projects.id, projectId))
		.limit(1);
	return project?.name ?? "Unknown project";
}

async function getUserName(userId: string): Promise<string> {
	const [user] = await db
		.select({ name: users.name })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return user?.name ?? "Someone";
}

async function getUserEmail(userId: string): Promise<string | null> {
	const [user] = await db
		.select({ email: users.email })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return user?.email ?? null;
}

async function getWorkspaceMemberIds(
	workspaceId: string,
	excludeUserId?: string,
): Promise<string[]> {
	const conditions = [
		eq(workspaceMembers.workspaceId, workspaceId),
		isNull(workspaceMembers.removedAt),
	];
	if (excludeUserId) {
		conditions.push(ne(workspaceMembers.userId, excludeUserId));
	}

	const rows = await db
		.select({ userId: workspaceMembers.userId })
		.from(workspaceMembers)
		.where(and(...conditions));

	return rows.map((r) => r.userId);
}

// ── Triggers ─────────────────────────────────────────────────────────────────

/**
 * Notify when a user is invited to a workspace.
 */
export async function notifyInviteReceived(args: {
	inviterId: string;
	inviteeUserId: string;
	workspaceId: string;
	workspaceName: string;
	role: string;
	email: string;
}): Promise<void> {
	const inviterName = await getUserName(args.inviterId);

	await createNotification({
		userId: args.inviteeUserId,
		type: "invite_received",
		title: `${inviterName} invited you to ${args.workspaceName}`,
		body: `You've been invited as a ${args.role}.`,
		workspaceId: args.workspaceId,
		emailSent: true,
	});

	sendEmail({
		to: args.email,
		subject: `You've been invited to ${args.workspaceName} on Discova`,
		react: InviteMemberEmail({
			inviterName,
			workspaceName: args.workspaceName,
			role: args.role,
		}),
	}).catch((err) => logger.error({ err }, "Failed to send invite email"));
}

/**
 * Notify comment author when someone replies.
 */
export async function notifyCommentReply(args: {
	replierId: string;
	commentAuthorId: string;
	commentPreview: string;
	workspaceId: string;
	projectId: string;
	targetType: string;
	targetId: string;
}): Promise<void> {
	// Don't notify yourself
	if (args.replierId === args.commentAuthorId) return;

	const [replierName, projectName, authorEmail] = await Promise.all([
		getUserName(args.replierId),
		getProjectName(args.projectId),
		getUserEmail(args.commentAuthorId),
	]);

	await createNotification({
		userId: args.commentAuthorId,
		type: "comment_reply",
		title: `${replierName} replied to your comment`,
		body: args.commentPreview.slice(0, 200),
		targetType: args.targetType,
		targetId: args.targetId,
		workspaceId: args.workspaceId,
		projectId: args.projectId,
		emailSent: !!authorEmail,
	});

	if (authorEmail) {
		sendEmail({
			to: authorEmail,
			subject: `${replierName} replied to your comment in ${projectName}`,
			react: CommentReplyEmail({
				replierName,
				commentPreview: args.commentPreview.slice(0, 200),
				projectName,
			}),
		}).catch((err) => logger.error({ err }, "Failed to send comment reply email"));
	}
}

/**
 * Notify mentioned user.
 */
export async function notifyMention(args: {
	mentionerId: string;
	mentionedUserId: string;
	context: string;
	commentPreview: string;
	workspaceId: string;
	projectId: string;
	targetType: string;
	targetId: string;
}): Promise<void> {
	if (args.mentionerId === args.mentionedUserId) return;

	const [mentionerName, projectName, mentionedEmail] = await Promise.all([
		getUserName(args.mentionerId),
		getProjectName(args.projectId),
		getUserEmail(args.mentionedUserId),
	]);

	await createNotification({
		userId: args.mentionedUserId,
		type: "mention",
		title: `${mentionerName} mentioned you`,
		body: args.commentPreview.slice(0, 200),
		targetType: args.targetType,
		targetId: args.targetId,
		workspaceId: args.workspaceId,
		projectId: args.projectId,
		emailSent: !!mentionedEmail,
	});

	if (mentionedEmail) {
		sendEmail({
			to: mentionedEmail,
			subject: `${mentionerName} mentioned you in ${projectName}`,
			react: MentionNotificationEmail({
				mentionerName,
				context: args.context,
				commentPreview: args.commentPreview.slice(0, 200),
				projectName,
			}),
		}).catch((err) => logger.error({ err }, "Failed to send mention email"));
	}
}

/**
 * Notify workspace members when a stack item priority changes.
 */
export async function notifyPriorityChanged(args: {
	changedByUserId: string;
	itemName: string;
	newTier: string;
	workspaceId: string;
	projectId: string;
	itemId: string;
}): Promise<void> {
	const [changedByName, projectName, memberIds] = await Promise.all([
		getUserName(args.changedByUserId),
		getProjectName(args.projectId),
		getWorkspaceMemberIds(args.workspaceId, args.changedByUserId),
	]);

	// Notify all other workspace members
	const notificationPromises = memberIds.map((userId) =>
		createNotification({
			userId,
			type: "priority_changed",
			title: `${args.itemName} moved to ${args.newTier.toUpperCase()}`,
			body: `${changedByName} changed the priority in ${projectName}.`,
			targetType: "stack_item",
			targetId: args.itemId,
			workspaceId: args.workspaceId,
			projectId: args.projectId,
		}),
	);

	await Promise.allSettled(notificationPromises);

	// Send email to first 10 members (avoid spam for large workspaces)
	const emailTargets = memberIds.slice(0, 10);
	for (const userId of emailTargets) {
		const email = await getUserEmail(userId);
		if (email) {
			sendEmail({
				to: email,
				subject: `Priority changed: ${args.itemName} → ${args.newTier.toUpperCase()}`,
				react: PriorityChangedEmail({
					itemName: args.itemName,
					newTier: args.newTier,
					changedByName,
					projectName,
				}),
			}).catch((err) => logger.error({ err }, "Failed to send priority email"));
		}
	}
}
