"use server";

import { auth } from "@/lib/auth/config";
import {
	type Notification,
	getUnreadCount,
	getUserNotifications,
	markAllRead,
	markNotificationRead,
} from "@/lib/queries/notifications";
import { z } from "zod";

// ── Get Notifications ───────────────────────────────────────────────────────

export async function getNotificationsAction(args?: {
	unreadOnly?: boolean;
}): Promise<{ notifications: Notification[]; unreadCount: number } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const [notifs, count] = await Promise.all([
		getUserNotifications(session.user.id, { unreadOnly: args?.unreadOnly }),
		getUnreadCount(session.user.id),
	]);

	return { notifications: notifs, unreadCount: count };
}

// ── Mark Read ───────────────────────────────────────────────────────────────

const markReadSchema = z.object({ notificationId: z.string().uuid() });

export async function markReadAction(args: {
	notificationId: string;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const parsed = markReadSchema.safeParse(args);
	if (!parsed.success) return { error: "Invalid notification ID" };

	await markNotificationRead(parsed.data.notificationId, session.user.id);
	return { success: true };
}

// ── Mark All Read ───────────────────────────────────────────────────────────

export async function markAllReadAction(): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	await markAllRead(session.user.id);
	return { success: true };
}
