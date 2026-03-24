"use client";

import { ChevronDown } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { CreateWorkspaceModal } from "./create-workspace-modal";
import { type WorkspaceItem, WorkspaceSwitcher } from "./workspace-switcher";

interface SidebarWorkspaceHeaderProps {
	workspace: { id: string; name: string; logoUrl: string | null };
	allWorkspaces: WorkspaceItem[];
}

export function SidebarWorkspaceHeader({ workspace, allWorkspaces }: SidebarWorkspaceHeaderProps) {
	const [switcherOpen, setSwitcherOpen] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);
	const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

	const initial = workspace.name[0]?.toUpperCase() ?? "W";

	function handleToggle() {
		if (!switcherOpen && buttonRef.current) {
			setAnchorRect(buttonRef.current.getBoundingClientRect());
		}
		setSwitcherOpen((prev) => !prev);
	}

	const handleClose = useCallback(() => setSwitcherOpen(false), []);
	const handleOpenModal = useCallback(() => setModalOpen(true), []);
	const handleCloseModal = useCallback(() => setModalOpen(false), []);

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				className="flex w-full items-center gap-3 px-4 py-3 transition-opacity hover:opacity-80"
				style={{
					backgroundColor: "var(--color-bg-surface)",
					borderBottom: "1px solid var(--color-border-subtle)",
				}}
				onClick={handleToggle}
				aria-label="Switch workspace"
				aria-expanded={switcherOpen}
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

				<span
					className="flex-1 truncate text-left text-sm font-semibold"
					style={{ color: "var(--color-text-primary)" }}
				>
					{workspace.name}
				</span>

				<ChevronDown
					size={14}
					style={{
						color: "var(--color-text-muted)",
						flexShrink: 0,
						transform: switcherOpen ? "rotate(180deg)" : "rotate(0deg)",
						transition: "transform 0.2s ease",
					}}
				/>
			</button>

			<WorkspaceSwitcher
				workspaces={allWorkspaces}
				activeWorkspaceId={workspace.id}
				isOpen={switcherOpen}
				onClose={handleClose}
				onCreateNew={handleOpenModal}
				anchorRect={anchorRect}
			/>

			<CreateWorkspaceModal isOpen={modalOpen} onClose={handleCloseModal} />
		</>
	);
}
