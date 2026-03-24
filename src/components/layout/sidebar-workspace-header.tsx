"use client";

import { ChevronDown } from "lucide-react";

interface SidebarWorkspaceHeaderProps {
	workspace: { name: string; logoUrl: string | null };
}

export function SidebarWorkspaceHeader({ workspace }: SidebarWorkspaceHeaderProps) {
	const initial = workspace.name[0]?.toUpperCase() ?? "W";

	return (
		<button
			type="button"
			className="flex w-full items-center gap-3 px-4 py-3 transition-opacity hover:opacity-80"
			style={{
				backgroundColor: "var(--color-bg-surface)",
				borderBottom: "1px solid var(--color-border-subtle)",
			}}
			aria-label="Switch workspace"
		>
			{/* Logo / Initial Avatar */}
			<div
				className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-md text-sm font-semibold"
				style={{
					backgroundColor: "var(--color-accent-gold)",
					color: "var(--color-bg-base)",
				}}
			>
				{workspace.logoUrl ? (
					<img
						src={workspace.logoUrl}
						alt={workspace.name}
						className="h-full w-full object-cover"
					/>
				) : (
					initial
				)}
			</div>

			{/* Workspace name */}
			<span
				className="flex-1 truncate text-left text-sm font-semibold"
				style={{ color: "var(--color-text-primary)" }}
			>
				{workspace.name}
			</span>

			<ChevronDown size={14} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
		</button>
	);
}
