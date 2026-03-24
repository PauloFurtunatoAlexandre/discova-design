"use client";

import { PHASE_MAP } from "@/lib/constants/phases";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface BreadcrumbProps {
	workspace: {
		id: string;
		name: string;
		slug: string;
	};
	projects: Array<{
		id: string;
		name: string;
		slug: string;
	}>;
}

export function Breadcrumb({ workspace, projects }: BreadcrumbProps) {
	const pathname = usePathname();
	const segments = pathname.split("/").filter(Boolean);

	// segments[0] = workspaceId, segments[1] = projectId, segments[2] = phase
	const workspaceId = segments[0];
	const projectId = segments[1];
	const phaseId = segments[2];

	const activeProject = projectId ? projects.find((p) => p.id === projectId) : undefined;
	const activePhase = phaseId ? PHASE_MAP[phaseId] : undefined;

	const separator = (
		<span
			className="mx-1.5 text-sm select-none"
			style={{ color: "var(--color-text-muted)" }}
			aria-hidden="true"
		>
			/
		</span>
	);

	return (
		<nav aria-label="Breadcrumb" className="flex items-center min-w-0">
			{/* Workspace */}
			{workspaceId ? (
				<Link
					href={`/${workspaceId}`}
					className="text-sm transition-colors hover:opacity-80 truncate max-w-[160px]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{workspace.name}
				</Link>
			) : (
				<span
					className="text-sm truncate max-w-[160px]"
					style={{ color: "var(--color-text-muted)" }}
				>
					{workspace.name}
				</span>
			)}

			{/* Project */}
			{activeProject && (
				<>
					{separator}
					{activePhase ? (
						<Link
							href={`/${workspaceId}/${projectId}`}
							className="text-sm transition-colors hover:opacity-80 truncate max-w-[160px]"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{activeProject.name}
						</Link>
					) : (
						<span
							className="text-sm font-semibold truncate max-w-[160px]"
							style={{ color: "var(--color-text-primary)" }}
						>
							{activeProject.name}
						</span>
					)}
				</>
			)}

			{/* Phase */}
			{activePhase && (
				<>
					{separator}
					<span
						className="text-sm font-semibold truncate max-w-[120px]"
						style={{ color: "var(--color-text-primary)" }}
					>
						{activePhase.name}
					</span>
				</>
			)}
		</nav>
	);
}
