import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Notification {
	id: string;
	type: string;
	title: string;
	body: string | null;
	targetType: string | null;
	targetId: string | null;
	workspaceId: string;
	projectId: string | null;
	isRead: boolean;
	createdAt: Date;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getUserNotifications(
	userId: string,
	options: { limit?: number | undefined; unreadOnly?: boolean | undefined } = {},
): Promise<Notification[]> {
	const { limit = 50, unreadOnly = false } = options;

	const conditions = [eq(notifications.userId, userId)];
	if (unreadOnly) {
		conditions.push(eq(notifications.isRead, false));
	}

	return db
		.select({
			id: notifications.id,
			type: notifications.type,
			title: notifications.title,
			body: notifications.body,
			targetType: notifications.targetType,
			targetId: notifications.targetId,
			workspaceId: notifications.workspaceId,
			projectId: notifications.projectId,
			isRead: notifications.isRead,
			createdAt: notifications.createdAt,
		})
		.from(notifications)
		.where(and(...conditions))
		.orderBy(desc(notifications.createdAt))
		.limit(limit);
}

export async function getUnreadCount(userId: string): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`COUNT(*)::int`.mapWith(Number) })
		.from(notifications)
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

	return result?.count ?? 0;
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
	await db
		.update(notifications)
		.set({ isRead: true })
		.where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllRead(userId: string): Promise<void> {
	await db
		.update(notifications)
		.set({ isRead: true })
		.where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

// ── Create ─────────────────────────────────────────────────────────────────────

export async function createNotification(args: {
	userId: string;
	type: "mention" | "insight_validated" | "priority_changed" | "invite_received" | "comment_reply";
	title: string;
	body?: string;
	targetType?: string;
	targetId?: string;
	workspaceId: string;
	projectId?: string;
	emailSent?: boolean;
}): Promise<string> {
	const [row] = await db
		.insert(notifications)
		.values({
			userId: args.userId,
			type: args.type,
			title: args.title,
			body: args.body ?? null,
			targetType: args.targetType ?? null,
			targetId: args.targetId ?? null,
			workspaceId: args.workspaceId,
			projectId: args.projectId ?? null,
			emailSent: args.emailSent ?? false,
		})
		.returning({ id: notifications.id });

	if (!row) throw new Error("Failed to create notification");
	return row.id;
}
