"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface Project {
	id: string;
	name: string;
	slug: string;
}

interface SidebarProjectListProps {
	workspaceId: string;
	projects: Project[];
}

export function SidebarProjectList({ workspaceId, projects }: SidebarProjectListProps) {
	const pathname = usePathname();
	const [isExpanded, setIsExpanded] = useState(true);

	const segments = pathname.split("/").filter(Boolean);
	const activeProjectId = segments.length >= 2 ? segments[1] : undefined;

	return (
		<div className="flex flex-col">
			{/* Section header */}
			<button
				type="button"
				className="flex w-full items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors"
				style={{ color: "var(--color-text-muted)" }}
				onClick={() => setIsExpanded((prev) => !prev)}
				aria-expanded={isExpanded}
				aria-label="Toggle projects list"
			>
				Projects
				<ChevronDown
					size={12}
					style={{
						transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
						transition: "transform 200ms ease",
						color: "var(--color-text-muted)",
					}}
				/>
			</button>

			{/* Project list with animation */}
			<AnimatePresence initial={false}>
				{isExpanded && (
					<motion.div
						key="project-list"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ type: "spring", stiffness: 300, damping: 30 }}
						style={{ overflow: "hidden" }}
					>
						<ul className="flex flex-col gap-0.5 px-2 pb-2">
							{projects.length === 0 ? (
								<li className="px-3 py-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
									No projects yet
								</li>
							) : (
								projects.map((project) => {
									const isActive = project.id === activeProjectId;
									return (
										<li key={project.id}>
											<Link
												href={`/${workspaceId}/${project.id}`}
												className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:opacity-90"
												style={{
													backgroundColor: isActive ? "var(--color-bg-raised)" : undefined,
													color: isActive
														? "var(--color-text-primary)"
														: "var(--color-text-secondary)",
													borderLeft: isActive
														? "3px solid var(--color-accent-gold)"
														: "3px solid transparent",
												}}
												aria-current={isActive ? "page" : undefined}
											>
												<FolderOpen size={14} style={{ flexShrink: 0 }} />
												<span className="truncate">{project.name}</span>
											</Link>
										</li>
									);
								})
							)}

							{/* New Project button */}
							<li>
								<button
									type="button"
									className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
									style={{ color: "var(--color-text-muted)" }}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent-gold)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
									}}
								>
									<Plus size={14} />
									New Project
								</button>
							</li>
						</ul>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
