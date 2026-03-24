"use client";

import { UserMenu } from "@/components/layout/user-menu";
import { HelpCircle, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
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
		<div
			className="relative flex items-center gap-2 px-4 py-3"
			style={{ borderTop: "1px solid var(--color-border-subtle)" }}
		>
			{/* User avatar + name — opens user menu */}
			<button
				type="button"
				className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
				onClick={() => setMenuOpen((prev) => !prev)}
				aria-label="Open user menu"
				aria-expanded={menuOpen}
			>
				<div
					className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
					style={{
						backgroundColor: "var(--color-bg-raised)",
						color: "var(--color-text-primary)",
						border: "1px solid var(--color-border-default)",
					}}
				>
					{user.image ? (
						<img
							src={user.image}
							alt={user.name ?? "User"}
							className="h-full w-full object-cover"
						/>
					) : (
						initials
					)}
				</div>
				<span className="truncate text-sm" style={{ color: "var(--color-text-secondary)" }}>
					{user.name ?? user.email ?? "User"}
				</span>
			</button>

			{/* Settings icon — Admin only */}
			{isAdminTier && (
				<button
					type="button"
					className="rounded-md p-1.5 transition-colors"
					style={{ color: "var(--color-text-muted)" }}
					onMouseEnter={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
					}}
					onMouseLeave={(e) => {
						(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
					}}
					onClick={() => router.push(`/${workspaceId}/settings`)}
					aria-label="Workspace settings"
				>
					<Settings size={16} />
				</button>
			)}

			{/* Help icon */}
			<button
				type="button"
				className="rounded-md p-1.5 transition-colors"
				style={{ color: "var(--color-text-muted)" }}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
				}}
				aria-label="Help and support"
			>
				<HelpCircle size={16} />
			</button>

			{/* User menu dropdown — positioned above */}
			<UserMenu
				user={user}
				isOpen={menuOpen}
				onClose={() => setMenuOpen(false)}
				userTier={userTier}
				position="above"
			/>
		</div>
	);
}
