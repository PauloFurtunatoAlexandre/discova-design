"use client";

import { syncStackItemsAction } from "@/actions/stack";
import { LockStackModal, ShareLinkPanel } from "@/components/stack/lock-stack-modal";
import { LockedBanner } from "@/components/stack/locked-banner";
import { StackTable } from "@/components/stack/stack-table";
import type { ActiveSnapshot, StackItemWithNode, StackSortBy } from "@/lib/queries/stack";
import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Lock, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface StackPageProps {
	items: StackItemWithNode[];
	stats: { totalItems: number; scoredItems: number; tieredItems: number };
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
	activeSnapshot: ActiveSnapshot | null;
	isLockerOrAdmin: boolean;
}

export function StackPageClient({
	items,
	stats,
	workspaceId,
	projectId,
	canEdit,
	activeSnapshot,
	isLockerOrAdmin,
}: StackPageProps) {
	const router = useRouter();
	const [isSyncing, startSync] = useTransition();
	const [sortBy, setSortBy] = useState<StackSortBy>("rice_desc");
	const [showLockModal, setShowLockModal] = useState(false);
	const [shareToken, setShareToken] = useState<string | null>(null);

	const isLocked = activeSnapshot !== null;
	const effectiveCanEdit = canEdit && !isLocked;

	const handleSync = useCallback(() => {
		startSync(async () => {
			const result = await syncStackItemsAction({ workspaceId, projectId });
			if ("success" in result && result.newItems > 0) {
				router.refresh();
			}
		});
	}, [workspaceId, projectId, router]);

	const handleLocked = useCallback(
		(token: string) => {
			setShowLockModal(false);
			setShareToken(token);
			router.refresh();
		},
		[router],
	);

	// Client-side sort (data already loaded)
	const sortedItems = [...items].sort((a, b) => {
		switch (sortBy) {
			case "rice_desc":
				return (b.riceScore ?? -1) - (a.riceScore ?? -1);
			case "rice_asc":
				return (a.riceScore ?? Number.MAX_VALUE) - (b.riceScore ?? Number.MAX_VALUE);
			case "tier": {
				const tierOrder = { now: 0, next: 1, later: 2, someday: 3 };
				const aOrder = a.tier ? tierOrder[a.tier] : 4;
				const bOrder = b.tier ? tierOrder[b.tier] : 4;
				if (aOrder !== bOrder) return aOrder - bOrder;
				return (b.riceScore ?? 0) - (a.riceScore ?? 0);
			}
			case "label_asc":
				return a.solutionLabel.localeCompare(b.solutionLabel);
			case "label_desc":
				return b.solutionLabel.localeCompare(a.solutionLabel);
			case "newest":
				return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			case "oldest":
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			default:
				return 0;
		}
	});

	return (
		<div style={{ padding: "24px 32px", maxWidth: 1200, margin: "0 auto" }}>
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: -12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					marginBottom: 24,
				}}
			>
				<div style={{ display: "flex", alignItems: "center", gap: 12 }}>
					<div
						style={{
							width: 40,
							height: 40,
							borderRadius: "var(--radius-md)",
							background: "var(--color-accent-green-muted)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<BarChart3 size={20} style={{ color: "var(--color-accent-green)" }} />
					</div>
					<div>
						<h1
							style={{
								fontFamily: "var(--font-display)",
								fontSize: "var(--text-xl)",
								color: "var(--color-text-primary)",
								margin: 0,
							}}
						>
							Priority Stack
						</h1>
						<p
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-muted)",
								margin: 0,
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							{stats.totalItems} solution{stats.totalItems !== 1 ? "s" : ""} · {stats.scoredItems}{" "}
							scored · {stats.tieredItems} tiered
						</p>
					</div>
				</div>

				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{/* Sort */}
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as StackSortBy)}
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							padding: "6px 12px",
							background: "var(--color-bg-surface)",
							border: "1px solid var(--color-border-subtle)",
							borderRadius: "var(--radius-md)",
							color: "var(--color-text-secondary)",
							cursor: "pointer",
						}}
					>
						<option value="rice_desc">RICE: High → Low</option>
						<option value="rice_asc">RICE: Low → High</option>
						<option value="tier">Tier</option>
						<option value="label_asc">Name: A → Z</option>
						<option value="label_desc">Name: Z → A</option>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
					</select>

					{/* Sync button — only when unlocked */}
					{effectiveCanEdit && (
						<button
							type="button"
							onClick={handleSync}
							disabled={isSyncing}
							title="Sync solution nodes from Map"
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "6px 12px",
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								background: "var(--color-accent-green-muted)",
								border: "1px solid var(--color-accent-green)",
								borderRadius: "var(--radius-md)",
								color: "var(--color-accent-green)",
								cursor: isSyncing ? "wait" : "pointer",
								opacity: isSyncing ? 0.6 : 1,
							}}
						>
							<RefreshCw
								size={14}
								style={{
									animation: isSyncing ? "spin 1s linear infinite" : "none",
								}}
							/>
							Sync
						</button>
					)}

					{/* Lock button — only when unlocked and has items */}
					{canEdit && !isLocked && items.length > 0 && (
						<button
							type="button"
							onClick={() => setShowLockModal(true)}
							style={{
								display: "flex",
								alignItems: "center",
								gap: 6,
								padding: "6px 12px",
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								background: "var(--color-accent-green)",
								border: "none",
								borderRadius: "var(--radius-md)",
								color: "var(--color-bg-base)",
								cursor: "pointer",
							}}
						>
							<Lock size={14} />
							Lock & Share
						</button>
					)}
				</div>
			</motion.div>

			{/* Locked banner */}
			{activeSnapshot && (
				<LockedBanner
					snapshot={activeSnapshot}
					workspaceId={workspaceId}
					projectId={projectId}
					canUnlock={isLockerOrAdmin}
				/>
			)}

			{/* Table */}
			<motion.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
				style={{
					background: "var(--color-bg-surface)",
					border: `1px solid ${isLocked ? "var(--color-accent-green)" : "var(--color-border-default)"}`,
					borderRadius: "var(--radius-lg)",
					overflow: "hidden",
					opacity: isLocked ? 0.85 : 1,
				}}
			>
				<StackTable
					items={sortedItems}
					workspaceId={workspaceId}
					projectId={projectId}
					canEdit={effectiveCanEdit}
				/>
			</motion.div>

			{/* Lock modal */}
			<AnimatePresence>
				{showLockModal && (
					<LockStackModal
						workspaceId={workspaceId}
						projectId={projectId}
						onClose={() => setShowLockModal(false)}
						onLocked={handleLocked}
					/>
				)}
			</AnimatePresence>

			{/* Share link panel */}
			<AnimatePresence>
				{shareToken && (
					<ShareLinkPanel shareToken={shareToken} onClose={() => setShareToken(null)} />
				)}
			</AnimatePresence>

			<style>{`
				@keyframes spin {
					from { transform: rotate(0deg); }
					to { transform: rotate(360deg); }
				}
			`}</style>
		</div>
	);
}
