"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { Bell, Menu, Search } from "lucide-react";
import { Breadcrumb } from "./breadcrumb";
import { UserMenu } from "./user-menu";

interface TopbarProps {
	workspace: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
	projects: Array<{
		id: string;
		name: string;
		slug: string;
	}>;
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	userTier?: string | undefined;
}

export function Topbar({ workspace, projects, user, userTier }: TopbarProps) {
	const { toggle } = useSidebar();

	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "U";

	return (
		<header className="flex h-[var(--topbar-height)] shrink-0 items-center justify-between border-b border-[--color-border-subtle] bg-[--color-bg-surface] px-6">
			{/* Left side */}
			<div className="flex min-w-0 items-center gap-4">
				{/* Hamburger — mobile only */}
				<button
					type="button"
					onClick={toggle}
					className="rounded-md p-1.5 text-[--color-text-muted] transition-colors hover:text-[--color-text-primary] md:hidden"
					aria-label="Open sidebar"
				>
					<Menu size={20} aria-hidden="true" />
				</button>

				{/* Breadcrumb */}
				<Breadcrumb workspace={workspace} projects={projects} />
			</div>

			{/* Right side — Actions */}
			<div className="flex items-center gap-1">
				{/* Search button — placeholder until search is implemented */}
				<button
					type="button"
					className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-[--color-text-muted] transition-colors hover:text-[--color-text-secondary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					aria-label="Search (coming soon)"
					disabled
					aria-disabled="true"
				>
					<Search size={16} aria-hidden="true" />
					<span className="hidden sm:inline">Search</span>
					<kbd className="hidden items-center rounded border border-[--color-border-subtle] bg-[--color-bg-raised] px-1.5 py-0.5 text-xs text-[--color-text-muted] sm:flex">
						⌘K
					</kbd>
				</button>

				{/* Notifications bell */}
				<button
					type="button"
					className="rounded-md p-1.5 text-[--color-text-muted] transition-colors hover:text-[--color-text-secondary] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					aria-label="Notifications"
				>
					<Bell size={18} aria-hidden="true" />
				</button>

				{/* User avatar — Radix DropdownMenu trigger */}
				<div className="ml-1">
					<UserMenu user={user} userTier={userTier} side="bottom" workspaceId={workspace.id}>
						<button
							type="button"
							className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[--color-border-default] bg-[--color-bg-raised] text-[11px] font-semibold text-[--color-text-primary] transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] focus-visible:ring-offset-1 focus-visible:ring-offset-[--color-bg-surface]"
							aria-label="Open user menu"
						>
							{user.image ? (
								<img
									src={user.image}
									alt={user.name ?? "User avatar"}
									className="h-full w-full object-cover"
								/>
							) : (
								<span aria-hidden="true">{initials}</span>
							)}
						</button>
					</UserMenu>
				</div>
			</div>
		</header>
	);
}
