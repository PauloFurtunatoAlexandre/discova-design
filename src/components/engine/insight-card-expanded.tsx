"use client";

import type { InsightWithRelations } from "@/lib/queries/engine";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { InsightCard } from "./insight-card";

interface InsightCardExpandedProps {
	insightId: string;
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
	onClose: () => void;
	onDelete?: (() => void) | undefined;
}

export function InsightCardExpanded({
	insightId,
	workspaceId,
	projectId,
	canEdit,
	onClose,
	onDelete,
}: InsightCardExpandedProps) {
	const prefersReducedMotion = useReducedMotion();
	const [insight, setInsight] = useState<InsightWithRelations | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const res = await fetch(
				`/api/engine/insights/${insightId}?workspaceId=${workspaceId}&projectId=${projectId}`,
			);
			if (res.ok) {
				const data = (await res.json()) as InsightWithRelations;
				setInsight(data);
			}
		} finally {
			setIsLoading(false);
		}
	}, [insightId, workspaceId, projectId]);

	useEffect(() => {
		load();
	}, [load]);

	// Close on Escape
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	return (
		<AnimatePresence>
			{/* Backdrop */}
			<motion.div
				key="backdrop"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
				className="fixed inset-0 z-40"
				style={{ background: "var(--color-overlay-scrim)" }}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Slide-over panel */}
			<motion.dialog
				key="panel"
				open
				aria-modal="true"
				aria-label="Insight detail"
				initial={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
				animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
				exit={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
				transition={
					prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }
				}
				className="fixed right-0 top-0 z-50 flex h-full w-full flex-col overflow-y-auto sm:w-[520px]"
				style={{
					background: "var(--color-bg-surface)",
					borderLeft: "1px solid var(--color-border-subtle)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				{/* Header */}
				<div
					className="flex shrink-0 items-center justify-between p-5"
					style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
				>
					<h2
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: "1.125rem",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						Insight Detail
					</h2>
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="rounded-md p-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none"
						style={{ color: "var(--color-text-muted)" }}
					>
						<X size={18} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 p-5">
					{isLoading ? (
						<p
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.8125rem",
								color: "var(--color-text-muted)",
							}}
						>
							Loading…
						</p>
					) : !insight ? (
						<p
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.875rem",
								color: "var(--color-status-error)",
							}}
						>
							Insight not found.
						</p>
					) : (
						<InsightCard
							insight={insight}
							variant="full"
							canEdit={canEdit}
							workspaceId={workspaceId}
							projectId={projectId}
							onDelete={() => {
								onDelete?.();
								onClose();
							}}
						/>
					)}
				</div>
			</motion.dialog>
		</AnimatePresence>
	);
}
