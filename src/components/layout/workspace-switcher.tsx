"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export interface WorkspaceItem {
	id: string;
	name: string;
	slug: string;
	logoUrl: string | null;
	isDemo: boolean;
	tier: string;
}

interface WorkspaceSwitcherProps {
	workspaces: WorkspaceItem[];
	activeWorkspaceId: string;
	isOpen: boolean;
	onClose: () => void;
	onCreateNew: () => void;
	/** Position the dropdown relative to — top/left in px from viewport */
	anchorRect?: DOMRect | null;
}

export function WorkspaceSwitcher({
	workspaces,
	activeWorkspaceId,
	isOpen,
	onClose,
	onCreateNew,
	anchorRect,
}: WorkspaceSwitcherProps) {
	const router = useRouter();
	const dropdownRef = useRef<HTMLDivElement>(null);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		function handleClick(e: MouseEvent) {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				onClose();
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isOpen, onClose]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, onClose]);

	function handleSelect(id: string) {
		onClose();
		router.push(`/${id}`);
	}

	const top = anchorRect ? anchorRect.bottom + 4 : 60;
	const left = anchorRect ? anchorRect.left : 0;

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={dropdownRef}
					style={{
						position: "fixed",
						top,
						left,
						zIndex: 200,
						width: 260,
						maxHeight: 360,
						overflowY: "auto",
						backgroundColor: "var(--color-bg-overlay, var(--color-bg-surface))",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-lg, 12px)",
						boxShadow: "var(--shadow-modal)",
					}}
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
				>
					{/* Header */}
					<div
						className="px-3 py-2"
						style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
					>
						<span
							className="text-xs font-medium uppercase"
							style={{
								fontFamily: "var(--font-mono)",
								color: "var(--color-text-muted)",
								letterSpacing: "var(--tracking-wide)",
							}}
						>
							Workspaces
						</span>
					</div>

					{/* Workspace list */}
					<div className="py-1">
						{workspaces.map((ws) => {
							const isActive = ws.id === activeWorkspaceId;
							const initial = ws.name[0]?.toUpperCase() ?? "W";

							return (
								<button
									key={ws.id}
									type="button"
									className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors"
									style={{
										backgroundColor: "transparent",
									}}
									onMouseEnter={(e) => {
										(e.currentTarget as HTMLButtonElement).style.backgroundColor =
											"var(--color-bg-raised)";
									}}
									onMouseLeave={(e) => {
										(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
									}}
									onClick={() => handleSelect(ws.id)}
								>
									{/* Avatar */}
									<div
										className="flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
										style={{
											backgroundColor: ws.logoUrl ? "transparent" : "var(--color-bg-raised)",
											color: "var(--color-text-muted)",
											border: "1px solid var(--color-border-subtle)",
										}}
									>
										{ws.logoUrl ? (
											<img src={ws.logoUrl} alt={ws.name} className="h-full w-full object-cover" />
										) : (
											initial
										)}
									</div>

									{/* Name */}
									<span
										className="flex-1 truncate text-sm"
										style={{
											color: "var(--color-text-primary)",
											maxWidth: 140,
										}}
									>
										{ws.name}
									</span>

									{/* Badges */}
									<div className="flex items-center gap-1.5 flex-shrink-0">
										{ws.isDemo && (
											<span
												className="text-xs px-1.5 py-0.5 rounded"
												style={{
													fontFamily: "var(--font-mono)",
													color: "var(--color-accent-gold)",
													backgroundColor:
														"var(--color-accent-gold-muted, color-mix(in srgb, var(--color-accent-gold) 12%, transparent))",
												}}
											>
												Demo
											</span>
										)}
										{isActive && <Check size={14} style={{ color: "var(--color-accent-gold)" }} />}
									</div>
								</button>
							);
						})}
					</div>

					{/* Footer */}
					<div className="py-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
						<button
							type="button"
							className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors"
							style={{ color: "var(--color-text-muted)" }}
							onMouseEnter={(e) => {
								(e.currentTarget as HTMLButtonElement).style.color = "var(--color-accent-gold)";
							}}
							onMouseLeave={(e) => {
								(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
							}}
							onClick={() => {
								onClose();
								onCreateNew();
							}}
						>
							<Plus size={14} />
							Create workspace
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
