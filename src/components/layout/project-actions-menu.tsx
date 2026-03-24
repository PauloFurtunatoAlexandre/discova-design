"use client";

import { archiveProjectAction } from "@/actions/projects";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, MoreHorizontal, Pencil } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

interface ProjectActionsMenuProps {
	projectId: string;
	projectName: string;
	isAdmin: boolean;
	onRenameStart: () => void;
}

export function ProjectActionsMenu({
	projectId,
	projectName: _projectName,
	isAdmin,
	onRenameStart,
}: ProjectActionsMenuProps) {
	const [isOpen, setIsOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const menuRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		function handleClick(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") setIsOpen(false);
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen]);

	function handleArchive() {
		setIsOpen(false);
		startTransition(async () => {
			await archiveProjectAction(projectId);
		});
	}

	function handleRename() {
		setIsOpen(false);
		onRenameStart();
	}

	return (
		<div ref={menuRef} className="relative flex-shrink-0">
			{/* Kebab trigger */}
			<button
				type="button"
				className="rounded p-0.5 transition-colors"
				style={{ color: "var(--color-text-muted)" }}
				onMouseEnter={(e) => {
					(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
				}}
				onMouseLeave={(e) => {
					(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
				}}
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setIsOpen((prev) => !prev);
				}}
				aria-label="Project options"
				disabled={isPending}
			>
				<MoreHorizontal size={14} />
			</button>

			{/* Dropdown */}
			<AnimatePresence>
				{isOpen && (
					<motion.div
						style={{
							position: "absolute",
							right: 0,
							top: "calc(100% + 4px)",
							zIndex: 150,
							width: 180,
							backgroundColor: "var(--color-bg-overlay, var(--color-bg-surface))",
							border: "1px solid var(--color-border-default)",
							borderRadius: "var(--radius-md, 8px)",
							boxShadow: "var(--shadow-sm)",
							overflow: "hidden",
						}}
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						transition={{ type: "spring", stiffness: 400, damping: 30 }}
					>
						<div className="py-1">
							{/* Rename */}
							<button
								type="button"
								className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
								style={{ color: "var(--color-text-primary)" }}
								onMouseEnter={(e) => {
									(e.currentTarget as HTMLButtonElement).style.backgroundColor =
										"var(--color-bg-raised)";
								}}
								onMouseLeave={(e) => {
									(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
								}}
								onClick={handleRename}
							>
								<Pencil size={13} style={{ flexShrink: 0 }} />
								Rename
							</button>

							{/* Archive — admin only */}
							{isAdmin && (
								<>
									<div
										style={{
											height: 1,
											margin: "4px 0",
											backgroundColor: "var(--color-border-subtle)",
										}}
									/>
									<button
										type="button"
										className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
										style={{ color: "var(--color-status-error)" }}
										onMouseEnter={(e) => {
											(e.currentTarget as HTMLButtonElement).style.backgroundColor =
												"var(--color-bg-raised)";
										}}
										onMouseLeave={(e) => {
											(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
										}}
										onClick={handleArchive}
									>
										<Archive size={13} style={{ flexShrink: 0 }} />
										Archive
									</button>
								</>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
