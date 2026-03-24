"use client";

import { usePathname } from "next/navigation";
import { SidebarBottomBar } from "./sidebar-bottom-bar";
import { SidebarPhaseNav } from "./sidebar-phase-nav";
import { SidebarProjectList } from "./sidebar-project-list";
import { SidebarWorkspaceHeader } from "./sidebar-workspace-header";

interface SidebarProps {
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

export function Sidebar({ workspace, projects, user, userTier }: SidebarProps) {
	const pathname = usePathname();
	const segments = pathname.split("/").filter(Boolean);
	// segments[0] = workspaceId, segments[1] = projectId, segments[2] = phase
	const activeProjectId = segments.length >= 2 ? segments[1] : undefined;

	return (
		<aside
			className="flex h-full flex-col"
			style={{
				width: "var(--sidebar-width, 240px)",
				backgroundColor: "var(--color-bg-surface)",
				borderRight: "1px solid var(--color-border-subtle)",
			}}
		>
			{/* Section A — Workspace Header */}
			<SidebarWorkspaceHeader workspace={workspace} />

			{/* Sections B + C — scrollable middle */}
			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
				<div className="pt-2">
					<SidebarProjectList workspaceId={workspace.id} projects={projects} />
				</div>

				<div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
					<SidebarPhaseNav workspaceId={workspace.id} projectId={activeProjectId} />
				</div>
			</div>

			{/* Section D — Bottom Bar */}
			<SidebarBottomBar user={user} userTier={userTier} />
		</aside>
	);
}
