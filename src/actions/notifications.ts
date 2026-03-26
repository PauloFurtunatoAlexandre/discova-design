"use server";

import { auth } from "@/lib/auth/config";
import {
	type Notification,
	getUnreadCount,
	getUserNotifications,
	markAllRead,
	markNotificationRead,
} from "@/lib/queries/notifications";

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

export async function markReadAction(args: {
	notificationId: string;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	await markNotificationRead(args.notificationId, session.user.id);
	return { success: true };
}

// ── Mark All Read ───────────────────────────────────────────────────────────

export async function markAllReadAction(): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	await markAllRead(session.user.id);
	return { success: true };
}
