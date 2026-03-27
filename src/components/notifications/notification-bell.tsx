"use client";

import { getNotificationsAction, markAllReadAction, markReadAction } from "@/actions/notifications";
import type { Notification } from "@/lib/queries/notifications";
import { formatRelativeTime } from "@/lib/utils/dates";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check, CheckCheck, MessageSquare, Star, UserPlus, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60_000; // 1 minute

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
	mention: { icon: MessageSquare, color: "var(--color-accent-gold)" },
	comment_reply: { icon: MessageSquare, color: "var(--color-accent-blue)" },
	invite_received: { icon: UserPlus, color: "var(--color-accent-purple)" },
	priority_changed: { icon: Zap, color: "var(--color-status-success)" },
	insight_validated: { icon: Star, color: "var(--color-accent-gold)" },
};

export function NotificationBell() {
	const [open, setOpen] = useState(false);
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const panelRef = useRef<HTMLDivElement>(null);

	const fetchNotifications = useCallback(async () => {
		const result = await getNotificationsAction();
		if ("notifications" in result) {
			setNotifications(result.notifications);
			setUnreadCount(result.unreadCount);
		}
	}, []);

	// Initial fetch + polling
	useEffect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	// Close on click outside
	useEffect(() => {
		if (!open) return;
		function handleClick(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	async function handleMarkRead(id: string) {
		await markReadAction({ notificationId: id });
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
		setUnreadCount((prev) => Math.max(0, prev - 1));
	}

	async function handleMarkAllRead() {
		await markAllReadAction();
		setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
		setUnreadCount(0);
	}

	return (
		<div className="relative" ref={panelRef}>
			{/* Bell button */}
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="relative p-2 rounded-lg transition-opacity hover:opacity-80"
				style={{ color: "var(--color-text-muted)" }}
				aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
			>
				<Bell size={18} />
				{unreadCount > 0 && (
					<span
						className="absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full text-[10px] font-bold"
						style={{
							minWidth: 16,
							height: 16,
							padding: "0 4px",
							backgroundColor: "var(--color-status-error)",
							color: "var(--color-text-inverse)",
						}}
					>
						{unreadCount > 99 ? "99+" : unreadCount}
					</span>
				)}
			</button>

			{/* Dropdown panel */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -8, scale: 0.97 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: -8, scale: 0.97 }}
						transition={{ type: "spring", stiffness: 400, damping: 30 }}
						className="absolute right-0 top-full mt-2"
						style={{
							width: 360,
							maxHeight: 480,
							backgroundColor: "var(--color-bg-surface)",
							border: "1px solid var(--color-border-default)",
							borderRadius: "var(--radius-lg)",
							boxShadow: "var(--shadow-lg)",
							zIndex: 200,
							overflow: "hidden",
						}}
					>
						{/* Header */}
						<div
							className="flex items-center justify-between px-4 py-3"
							style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
						>
							<span
								className="text-sm font-semibold"
								style={{ color: "var(--color-text-primary)" }}
							>
								Notifications
							</span>
							{unreadCount > 0 && (
								<button
									type="button"
									onClick={handleMarkAllRead}
									className="flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
									style={{ color: "var(--color-accent-blue)" }}
								>
									<CheckCheck size={12} />
									Mark all read
								</button>
							)}
						</div>

						{/* List */}
						<div className="overflow-y-auto" style={{ maxHeight: 420 }}>
							{notifications.length === 0 ? (
								<div className="flex flex-col items-center py-10">
									<Bell size={24} style={{ color: "var(--color-text-muted)", opacity: 0.4 }} />
									<p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
										No notifications yet
									</p>
								</div>
							) : (
								notifications.map((n) => (
									<NotificationItem key={n.id} notification={n} onMarkRead={handleMarkRead} />
								))
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Notification Item ────────────────────────────────────────────────────────

function NotificationItem({
	notification,
	onMarkRead,
}: {
	notification: Notification;
	onMarkRead: (id: string) => void;
}) {
	const config = TYPE_CONFIG[notification.type] ?? { icon: Bell, color: "var(--color-text-muted)" };
	const Icon = config.icon;

	return (
		<button
			type="button"
			className="flex items-start gap-3 px-4 py-3 w-full text-left transition-colors hover:bg-[--color-bg-elevated] cursor-pointer"
			style={{
				borderBottom: "1px solid var(--color-border-subtle)",
				backgroundColor: notification.isRead ? "transparent" : "var(--color-accent-blue-muted)",
			}}
			onClick={() => {
				if (!notification.isRead) onMarkRead(notification.id);
			}}
		>
			<div
				className="flex-shrink-0 mt-0.5 flex items-center justify-center rounded-full"
				style={{
					width: 28,
					height: 28,
					backgroundColor: `color-mix(in srgb, ${config.color} 10%, transparent)`,
				}}
			>
				<Icon size={14} style={{ color: config.color }} />
			</div>
			<div className="flex-1 min-w-0">
				<p
					className="text-sm leading-snug"
					style={{
						color: "var(--color-text-primary)",
						fontWeight: notification.isRead ? 400 : 500,
					}}
				>
					{notification.title}
				</p>
				{notification.body && (
					<p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
						{notification.body}
					</p>
				)}
				<p
					className="text-xs mt-1"
					style={{
						fontFamily: "var(--font-mono)",
						color: "var(--color-text-muted)",
					}}
				>
					{formatRelativeTime(notification.createdAt)}
				</p>
			</div>
			{!notification.isRead && (
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation();
						onMarkRead(notification.id);
					}}
					className="flex-shrink-0 p-1 rounded transition-opacity hover:opacity-70"
					style={{ color: "var(--color-accent-blue)" }}
					aria-label="Mark as read"
				>
					<Check size={14} />
				</button>
			)}
		</button>
	);
}

