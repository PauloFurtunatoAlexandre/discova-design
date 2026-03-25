"use client";

import { updateProjectAction } from "@/actions/projects";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { CreateProjectModal } from "./create-project-modal";
import { ProjectActionsMenu } from "./project-actions-menu";

interface Project {
	id: string;
	name: string;
	slug: string;
}

interface SidebarProjectListProps {
	workspaceId: string;
	projects: Project[];
	userTier?: string | undefined;
}

// ─── Inline rename form ───────────────────────────────────────────────────────

function ProjectRenameInput({
	projectId,
	initialName,
	onCancel,
}: {
	projectId: string;
	initialName: string;
	onCancel: () => void;
}) {
	const boundAction = updateProjectAction.bind(null, projectId);
	const [state, formAction, isPending] = useActionState(boundAction, null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Close on success
	useEffect(() => {
		if (state?.success) onCancel();
	}, [state?.success, onCancel]);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	return (
		<form
			action={formAction}
			className="flex items-center gap-1 px-3 py-1.5"
			onKeyDown={(e) => {
				if (e.key === "Escape") {
					e.preventDefault();
					onCancel();
				}
			}}
		>
			<input
				ref={inputRef}
				name="name"
				defaultValue={initialName}
				maxLength={200}
				required
				className="min-w-0 flex-1 rounded bg-transparent text-sm outline-none"
				style={{
					color: "var(--color-text-primary)",
					borderBottom: "1px solid var(--color-accent-gold)",
					paddingBottom: 1,
				}}
			/>
			<button
				type="submit"
				disabled={isPending}
				className="rounded px-1 py-0.5 text-xs font-medium transition-colors"
				style={{ color: "var(--color-accent-gold)" }}
				aria-label="Save"
			>
				✓
			</button>
			<button
				type="button"
				onClick={onCancel}
				className="rounded px-1 py-0.5 text-xs transition-colors"
				style={{ color: "var(--color-text-muted)" }}
				aria-label="Cancel"
			>
				✕
			</button>
		</form>
	);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SidebarProjectList({ workspaceId, projects, userTier }: SidebarProjectListProps) {
	const pathname = usePathname();
	const [isExpanded, setIsExpanded] = useState(true);
	const [modalOpen, setModalOpen] = useState(false);
	const [renamingProjectId, setRenamingProjectId] = useState<string | null>(null);
	const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);

	const segments = pathname.split("/").filter(Boolean);
	const activeProjectId = segments.length >= 2 ? segments[1] : undefined;
	const isAdminUser = userTier === "admin";

	return (
		<>
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
									<li className="px-2 py-3 flex flex-col items-center gap-2 text-center">
										<span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
											No projects yet
										</span>
										<button
											type="button"
											className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[--color-accent-gold-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
											style={{
												color: "var(--color-accent-gold)",
												border: "1px solid var(--color-accent-gold)",
												backgroundColor: "transparent",
											}}
											onClick={() => setModalOpen(true)}
										>
											<Plus size={13} />
											Create your first project
										</button>
									</li>
								) : (
									projects.map((project) => {
										const isActive = project.id === activeProjectId;
										const isRenaming = renamingProjectId === project.id;
										const isHovered = hoveredProjectId === project.id;

										return (
											<li key={project.id}>
												{isRenaming ? (
													<ProjectRenameInput
														projectId={project.id}
														initialName={project.name}
														onCancel={() => setRenamingProjectId(null)}
													/>
												) : (
													<div
														className="group flex items-center rounded-md transition-colors"
														style={{
															backgroundColor: isActive ? "var(--color-bg-raised)" : "transparent",
															borderLeft: isActive
																? "3px solid var(--color-accent-gold)"
																: "3px solid transparent",
														}}
														onMouseEnter={() => setHoveredProjectId(project.id)}
														onMouseLeave={() => setHoveredProjectId(null)}
													>
														<Link
															href={`/${workspaceId}/${project.id}`}
															className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2 text-sm transition-colors hover:opacity-90"
															style={{
																color: isActive
																	? "var(--color-text-primary)"
																	: "var(--color-text-secondary)",
															}}
															aria-current={isActive ? "page" : undefined}
														>
															<FolderOpen size={14} style={{ flexShrink: 0 }} />
															<span className="truncate">{project.name}</span>
														</Link>

														{/* Kebab — visible on hover */}
														<div
															className="pr-1.5"
															style={{
																opacity: isHovered || isActive ? 1 : 0,
																transition: "opacity 150ms ease",
															}}
														>
															<ProjectActionsMenu
																projectId={project.id}
																projectName={project.name}
																isAdmin={isAdminUser}
																onRenameStart={() => setRenamingProjectId(project.id)}
															/>
														</div>
													</div>
												)}
											</li>
										);
									})
								)}

								{/* New Project button — always shown when projects exist */}
								{projects.length > 0 && (
									<li>
										<button
											type="button"
											className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:text-[--color-accent-gold] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
											style={{ color: "var(--color-text-muted)" }}
											onClick={() => setModalOpen(true)}
										>
											<Plus size={14} />
											New Project
										</button>
									</li>
								)}
							</ul>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Create project modal — rendered outside the list */}
			<CreateProjectModal
				workspaceId={workspaceId}
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
			/>
		</>
	);
}
