"use client";

import { updateRiceFieldAction, updateTierAction } from "@/actions/stack";
import { EditableNumberCell, ImpactCell } from "@/components/stack/rice-cell";
import { TierBadge } from "@/components/stack/tier-badge";
import type { StackItemWithNode } from "@/lib/queries/stack";
import { formatRiceScore } from "@/lib/utils/rice";
import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowUpDown, Minus } from "lucide-react";
import { useCallback, useState, useTransition } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface StackTableProps {
	items: StackItemWithNode[];
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
}

// ── Column header ──────────────────────────────────────────────────────────────

function ColHeader({
	label,
	tooltip,
	align = "left",
}: {
	label: string;
	tooltip?: string;
	align?: "left" | "right" | "center";
}) {
	return (
		<div
			title={tooltip}
			style={{
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				color: "var(--color-text-muted)",
				textTransform: "uppercase",
				letterSpacing: "0.05em",
				padding: "8px 12px",
				textAlign: align,
				whiteSpace: "nowrap",
				userSelect: "none",
			}}
		>
			{label}
		</div>
	);
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({ score, maxScore }: { score: number | null; maxScore: number }) {
	if (score == null) return <Minus size={14} style={{ color: "var(--color-text-muted)" }} />;

	const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
			<div
				style={{
					flex: 1,
					height: 6,
					borderRadius: 3,
					background: "var(--color-bg-sunken)",
					overflow: "hidden",
				}}
			>
				<motion.div
					initial={{ width: 0 }}
					animate={{ width: `${pct}%` }}
					transition={{ type: "spring", stiffness: 400, damping: 30 }}
					style={{
						height: "100%",
						borderRadius: 3,
						background: "var(--color-accent-green)",
					}}
				/>
			</div>
			<span
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "var(--text-xs)",
					color: "var(--color-text-primary)",
					minWidth: 36,
					textAlign: "right",
				}}
			>
				{formatRiceScore(score)}
			</span>
		</div>
	);
}

// ── Main Table ─────────────────────────────────────────────────────────────────

export function StackTable({ items, workspaceId, projectId, canEdit }: StackTableProps) {
	const [isPending, startTransition] = useTransition();

	const maxScore = Math.max(...items.map((i) => i.riceScore ?? 0), 1);

	const handleRiceUpdate = useCallback(
		(
			stackItemId: string,
			field: "reachOverride" | "impactOverride" | "confidenceOverride" | "effortManual",
			value: number | null,
		) => {
			startTransition(async () => {
				await updateRiceFieldAction({
					workspaceId,
					projectId,
					stackItemId,
					field,
					value,
				});
			});
		},
		[workspaceId, projectId],
	);

	const handleTierUpdate = useCallback(
		(stackItemId: string, tier: "now" | "next" | "later" | "someday" | null) => {
			startTransition(async () => {
				await updateTierAction({
					workspaceId,
					projectId,
					stackItemId,
					tier,
				});
			});
		},
		[workspaceId, projectId],
	);

	if (items.length === 0) {
		return <StackEmptyState />;
	}

	return (
		<div
			style={{
				width: "100%",
				overflowX: "auto",
				opacity: isPending ? 0.7 : 1,
				transition: "opacity 150ms",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "minmax(200px, 2fr) 80px 100px 80px 80px minmax(140px, 1fr) 100px",
					borderBottom: "1px solid var(--color-border-default)",
					background: "var(--color-bg-surface)",
					position: "sticky",
					top: 0,
					zIndex: 1,
				}}
			>
				<ColHeader label="Solution" />
				<ColHeader label="Reach" tooltip="Number of users affected" align="right" />
				<ColHeader label="Impact" tooltip="0.25–3.0 scale" align="right" />
				<ColHeader label="Conf" tooltip="Confidence 0–1" align="right" />
				<ColHeader label="Effort" tooltip="Person-weeks" align="right" />
				<ColHeader label="RICE Score" align="right" />
				<ColHeader label="Tier" align="center" />
			</div>

			{/* Rows */}
			{items.map((item, index) => (
				<motion.div
					key={item.id}
					initial={{ opacity: 0, y: 8 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						type: "spring",
						stiffness: 500,
						damping: 30,
						delay: index * 0.03,
					}}
					style={{
						display: "grid",
						gridTemplateColumns: "minmax(200px, 2fr) 80px 100px 80px 80px minmax(140px, 1fr) 100px",
						borderBottom: "1px solid var(--color-border-subtle)",
						alignItems: "center",
						minHeight: 48,
					}}
					className="stack-row"
				>
					{/* Solution name + linked problems */}
					<div style={{ padding: "8px 12px", overflow: "hidden" }}>
						<div
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-primary)",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
							title={item.solutionLabel}
						>
							{item.solutionLabel}
						</div>
						{item.linkedProblems.length > 0 && (
							<div
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "10px",
									color: "var(--color-text-muted)",
									marginTop: 2,
									whiteSpace: "nowrap",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
								title={item.linkedProblems.join(", ")}
							>
								{item.linkedProblems.join(" · ")}
							</div>
						)}
					</div>

					{/* Reach */}
					<div style={{ padding: "4px 6px" }}>
						<EditableNumberCell
							value={item.reachOverride}
							autoValue={item.reachAuto}
							onSave={(v) => handleRiceUpdate(item.id, "reachOverride", v)}
							disabled={!canEdit}
							min={0}
							placeholder="—"
						/>
					</div>

					{/* Impact */}
					<div style={{ padding: "4px 6px" }}>
						<ImpactCell
							value={item.impactOverride}
							autoValue={item.impactAuto}
							onSave={(v) => handleRiceUpdate(item.id, "impactOverride", v)}
							disabled={!canEdit}
						/>
					</div>

					{/* Confidence */}
					<div style={{ padding: "4px 6px" }}>
						<EditableNumberCell
							value={item.confidenceOverride}
							autoValue={item.confidenceAuto}
							onSave={(v) => handleRiceUpdate(item.id, "confidenceOverride", v)}
							disabled={!canEdit}
							min={0}
							max={1}
							step={0.1}
							placeholder="—"
						/>
					</div>

					{/* Effort */}
					<div style={{ padding: "4px 6px" }}>
						<EditableNumberCell
							value={item.effortManual}
							autoValue={item.effortJiraEstimate ?? item.effortLinearEstimate}
							onSave={(v) => handleRiceUpdate(item.id, "effortManual", v)}
							disabled={!canEdit}
							min={0.1}
							step={0.5}
							placeholder="—"
						/>
					</div>

					{/* RICE Score */}
					<div style={{ padding: "8px 12px" }}>
						<ScoreBar score={item.riceScore} maxScore={maxScore} />
					</div>

					{/* Tier */}
					<div
						style={{
							padding: "4px 8px",
							display: "flex",
							justifyContent: "center",
						}}
					>
						<TierBadge
							tier={item.tier}
							onChangeTier={canEdit ? (tier) => handleTierUpdate(item.id, tier) : undefined}
							disabled={!canEdit}
						/>
					</div>
				</motion.div>
			))}

			<style>{`
				.stack-row:hover {
					background: var(--color-bg-item-hover);
				}
			`}</style>
		</div>
	);
}

// ── Empty State ────────────────────────────────────────────────────────────────

function StackEmptyState() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				padding: "64px 24px",
				textAlign: "center",
			}}
		>
			<div
				style={{
					width: 64,
					height: 64,
					borderRadius: "var(--radius-lg)",
					background: "var(--color-accent-green-muted)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					marginBottom: 16,
				}}
			>
				<ArrowUpDown size={28} style={{ color: "var(--color-accent-green)" }} />
			</div>
			<h3
				style={{
					fontFamily: "var(--font-display)",
					fontSize: "var(--text-lg)",
					color: "var(--color-text-primary)",
					marginBottom: 8,
				}}
			>
				No solutions to prioritise yet
			</h3>
			<p
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "var(--text-sm)",
					color: "var(--color-text-secondary)",
					maxWidth: 400,
				}}
			>
				Add solution nodes to your Opportunity Map first. They'll automatically appear here for RICE
				scoring and tier assignment.
			</p>
		</div>
	);
}
