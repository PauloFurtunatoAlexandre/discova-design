"use client";

import { SidebarProvider, useSidebar } from "@/hooks/useSidebar";
import type { ReactNode } from "react";
import { MobileSidebar } from "./mobile-sidebar";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import type { WorkspaceItem } from "./workspace-switcher";

interface AppShellProps {
	children: ReactNode;
	workspace: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
	allWorkspaces: WorkspaceItem[];
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
	userTier?: string;
	activeProjectId?: string;
	activePhase?: string;
}

function AppShellInner({
	children,
	workspace,
	allWorkspaces,
	projects,
	user,
	userTier,
}: AppShellProps) {
	// useSidebar is available here because AppShell wraps with SidebarProvider
	useSidebar(); // ensure context is available; actual usage is in Topbar/MobileSidebar

	return (
		<div
			className="flex h-screen overflow-hidden"
			style={{ backgroundColor: "var(--color-bg-base)" }}
		>
			{/* Desktop Sidebar — hidden on mobile */}
			<div className="hidden md:flex">
				<Sidebar
					workspace={workspace}
					allWorkspaces={allWorkspaces}
					projects={projects}
					user={user}
					userTier={userTier}
				/>
			</div>

			{/* Mobile Sidebar — drawer */}
			<MobileSidebar workspace={workspace} projects={projects} user={user} userTier={userTier} />

			{/* Main content area */}
			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<Topbar workspace={workspace} projects={projects} user={user} userTier={userTier} />
				<main
					className="flex-1 overflow-y-auto"
					style={{ backgroundColor: "var(--color-bg-base)" }}
				>
					{children}
				</main>
			</div>
		</div>
	);
}

export function AppShell(props: AppShellProps) {
	return (
		<SidebarProvider>
			<AppShellInner {...props} />
		</SidebarProvider>
	);
}
