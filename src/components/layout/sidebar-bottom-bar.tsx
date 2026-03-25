"use client";

import { UserMenu } from "@/components/layout/user-menu";
import { HelpCircle, Settings } from "lucide-react";
import Link from "next/link";

interface SidebarBottomBarProps {
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	userTier?: string | undefined;
	workspaceId: string;
}

export function SidebarBottomBar({ user, userTier, workspaceId }: SidebarBottomBarProps) {
	const isAdminTier = userTier === "admin";

	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "U";

	return (
		<div className="flex items-center gap-2 border-t border-[--color-border-subtle] px-4 py-3">
			{/* User avatar + name — Radix DropdownMenu trigger */}
			<UserMenu user={user} userTier={userTier} side="top" workspaceId={workspaceId}>
				<button
					type="button"
					className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					aria-label="Open user menu"
				>
					<div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-[--color-border-default] bg-[--color-bg-raised] text-xs font-semibold text-[--color-text-primary]">
						{user.image ? (
							<img
								src={user.image}
								alt={user.name ?? "User avatar"}
								className="h-full w-full object-cover"
							/>
						) : (
							<span aria-hidden="true">{initials}</span>
						)}
					</div>
					<span className="truncate text-sm text-[--color-text-secondary]">
						{user.name ?? user.email ?? "User"}
					</span>
				</button>
			</UserMenu>

			{/* Settings shortcut — Admin only */}
			{isAdminTier && (
				<Link
					href={`/${workspaceId}/settings`}
					className="rounded-md p-1.5 text-[--color-text-muted] transition-colors hover:text-[--color-text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					aria-label="Workspace settings"
				>
					<Settings size={16} aria-hidden="true" />
				</Link>
			)}

			{/* Help shortcut */}
			<button
				type="button"
				className="rounded-md p-1.5 text-[--color-text-muted] transition-colors hover:text-[--color-text-primary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
				aria-label="Help and support"
			>
				<HelpCircle size={16} aria-hidden="true" />
			</button>
		</div>
	);
}
