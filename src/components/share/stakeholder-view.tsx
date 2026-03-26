"use client";

import { TierBadge } from "@/components/stack/tier-badge";
import type { StackItemWithNode } from "@/lib/queries/stack";
import { formatRiceScore } from "@/lib/utils/rice";
import { motion } from "framer-motion";
import { BarChart3, Download, Minus } from "lucide-react";
import { useCallback, useRef } from "react";

interface StakeholderViewProps {
	items: StackItemWithNode[];
	viewMode: "stakeholder" | "presentation";
}

export function StakeholderView({ items, viewMode }: StakeholderViewProps) {
	const contentRef = useRef<HTMLDivElement>(null);

	const handlePrint = useCallback(() => {
		window.print();
	}, []);

	const maxScore = Math.max(...items.map((i) => i.riceScore ?? 0), 1);

	// Group by tier for presentation mode
	const tierGroups = viewMode === "presentation" ? groupByTier(items) : null;

	return (
		<div
			style={{
				minHeight: "100vh",
				background: "var(--color-bg-base)",
				padding: "24px",
			}}
		>
			<div
				ref={contentRef}
				style={{ maxWidth: 1000, margin: "0 auto" }}
				className="share-printable"
			>
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
								{items.length} solution{items.length !== 1 ? "s" : ""} · read-only snapshot
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={handlePrint}
						className="no-print"
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							padding: "8px 14px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "var(--color-accent-green-muted)",
							border: "1px solid var(--color-accent-green)",
							borderRadius: "var(--radius-md)",
							color: "var(--color-accent-green)",
							cursor: "pointer",
						}}
					>
						<Download size={14} />
						Export PDF
					</button>
				</motion.div>

				{/* Content */}
				{viewMode === "stakeholder" ? (
					<StakeholderTable items={items} maxScore={maxScore} />
				) : (
					<PresentationView groups={tierGroups!} />
				)}
			</div>

			{/* Print styles */}
			<style>{`
				@media print {
					body {
						background: white !important;
						color: black !important;
						-webkit-print-color-adjust: exact;
						print-color-adjust: exact;
					}
					.no-print {
						display: none !important;
					}
					.share-printable {
						max-width: 100% !important;
						padding: 0 !important;
					}
				}
			`}</style>
		</div>
	);
}

// ── Stakeholder Table (full detail) ───────────────────────────────────────────

function StakeholderTable({ items, maxScore }: { items: StackItemWithNode[]; maxScore: number }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 400, damping: 30, delay: 0.1 }}
			style={{
				background: "var(--color-bg-surface)",
				border: "1px solid var(--color-border-default)",
				borderRadius: "var(--radius-lg)",
				overflow: "hidden",
			}}
		>
			{/* Header */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "minmax(200px, 2fr) 70px 80px 60px 60px minmax(120px, 1fr) 90px",
					borderBottom: "1px solid var(--color-border-default)",
					background: "var(--color-bg-surface)",
				}}
			>
				<ColHeader label="Solution" />
				<ColHeader label="Reach" align="right" />
				<ColHeader label="Impact" align="right" />
				<ColHeader label="Conf" align="right" />
				<ColHeader label="Effort" align="right" />
				<ColHeader label="RICE" align="right" />
				<ColHeader label="Tier" align="center" />
			</div>

			{/* Rows */}
			{items.map((item, index) => {
				const reach = item.reachOverride ?? item.reachAuto;
				const impact = item.impactOverride ?? item.impactAuto;
				const confidence = item.confidenceOverride ?? item.confidenceAuto;
				const effort = item.effortManual ?? item.effortJiraEstimate ?? item.effortLinearEstimate;

				return (
					<motion.div
						key={item.id}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: index * 0.02 }}
						style={{
							display: "grid",
							gridTemplateColumns: "minmax(200px, 2fr) 70px 80px 60px 60px minmax(120px, 1fr) 90px",
							borderBottom: "1px solid var(--color-border-subtle)",
							alignItems: "center",
							minHeight: 44,
						}}
					>
						{/* Solution */}
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
								>
									{item.linkedProblems.join(" · ")}
								</div>
							)}
						</div>

						{/* Reach */}
						<ValueCell value={reach} />
						{/* Impact */}
						<ValueCell value={impact} />
						{/* Confidence */}
						<ValueCell value={confidence} />
						{/* Effort */}
						<ValueCell value={effort} />

						{/* RICE Score */}
						<div style={{ padding: "8px 12px" }}>
							<ScoreBar score={item.riceScore} maxScore={maxScore} />
						</div>

						{/* Tier */}
						<div style={{ padding: "4px 8px", display: "flex", justifyContent: "center" }}>
							<TierBadge tier={item.tier} disabled />
						</div>
					</motion.div>
				);
			})}
		</motion.div>
	);
}

// ── Presentation View (tier groups) ───────────────────────────────────────────

interface TierGroup {
	tier: string;
	label: string;
	items: StackItemWithNode[];
}

function groupByTier(items: StackItemWithNode[]): TierGroup[] {
	const groups: Record<string, StackItemWithNode[]> = {
		now: [],
		next: [],
		later: [],
		someday: [],
		unassigned: [],
	};

	for (const item of items) {
		const key = item.tier ?? "unassigned";
		groups[key]?.push(item);
	}

	const labels: Record<string, string> = {
		now: "Now",
		next: "Next",
		later: "Later",
		someday: "Someday",
		unassigned: "Unassigned",
	};

	return Object.entries(groups)
		.filter(([, items]) => items.length > 0)
		.map(([tier, items]) => ({
			tier,
			label: labels[tier] ?? tier,
			items,
		}));
}

function PresentationView({ groups }: { groups: TierGroup[] }) {
	return (
		<div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
			{groups.map((group, groupIndex) => (
				<motion.div
					key={group.tier}
					initial={{ opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						type: "spring",
						stiffness: 400,
						damping: 30,
						delay: groupIndex * 0.1,
					}}
				>
					{/* Group header */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginBottom: 12,
						}}
					>
						<TierBadge
							tier={
								group.tier === "unassigned"
									? null
									: (group.tier as "now" | "next" | "later" | "someday")
							}
							disabled
						/>
						<span
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							{group.items.length} item{group.items.length !== 1 ? "s" : ""}
						</span>
					</div>

					{/* Cards */}
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
							gap: 12,
						}}
					>
						{group.items.map((item, i) => (
							<PresentationCard key={item.id} item={item} index={i} />
						))}
					</div>
				</motion.div>
			))}
		</div>
	);
}

function PresentationCard({ item, index }: { item: StackItemWithNode; index: number }) {
	const reach = item.reachOverride ?? item.reachAuto;
	const impact = item.impactOverride ?? item.impactAuto;
	const confidence = item.confidenceOverride ?? item.confidenceAuto;
	const effort = item.effortManual ?? item.effortJiraEstimate ?? item.effortLinearEstimate;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ type: "spring", stiffness: 500, damping: 30, delay: index * 0.03 }}
			style={{
				background: "var(--color-bg-surface)",
				border: "1px solid var(--color-border-default)",
				borderRadius: "var(--radius-lg)",
				padding: 16,
			}}
		>
			<h3
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "var(--text-sm)",
					color: "var(--color-text-primary)",
					margin: "0 0 8px",
					fontWeight: 500,
				}}
			>
				{item.solutionLabel}
			</h3>

			{item.linkedProblems.length > 0 && (
				<p
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "10px",
						color: "var(--color-text-muted)",
						margin: "0 0 12px",
					}}
				>
					{item.linkedProblems.join(" · ")}
				</p>
			)}

			{/* RICE breakdown */}
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr 1fr 1fr",
					gap: 8,
					marginBottom: 12,
				}}
			>
				<RiceChip label="R" value={reach} />
				<RiceChip label="I" value={impact} />
				<RiceChip label="C" value={confidence} />
				<RiceChip label="E" value={effort} />
			</div>

			{/* Score */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-muted)",
						textTransform: "uppercase",
					}}
				>
					RICE
				</span>
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "var(--text-lg)",
						color: "var(--color-accent-green)",
						fontWeight: 600,
					}}
				>
					{formatRiceScore(item.riceScore)}
				</span>
			</div>
		</motion.div>
	);
}

function RiceChip({ label, value }: { label: string; value: number | null }) {
	return (
		<div
			style={{
				textAlign: "center",
				padding: "4px 0",
				background: "var(--color-bg-sunken)",
				borderRadius: "var(--radius-sm)",
			}}
		>
			<div
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "10px",
					color: "var(--color-text-muted)",
					textTransform: "uppercase",
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "var(--text-sm)",
					color: value != null ? "var(--color-text-primary)" : "var(--color-text-muted)",
				}}
			>
				{value != null ? value : "—"}
			</div>
		</div>
	);
}

// ── Shared components ─────────────────────────────────────────────────────────

function ColHeader({
	label,
	align = "left",
}: { label: string; align?: "left" | "right" | "center" }) {
	return (
		<div
			style={{
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				color: "var(--color-text-muted)",
				textTransform: "uppercase",
				letterSpacing: "0.05em",
				padding: "8px 12px",
				textAlign: align,
				whiteSpace: "nowrap",
			}}
		>
			{label}
		</div>
	);
}

function ValueCell({ value }: { value: number | null }) {
	return (
		<div
			style={{
				padding: "4px 12px",
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				color: value != null ? "var(--color-text-primary)" : "var(--color-text-muted)",
				textAlign: "right",
			}}
		>
			{value != null ? value : "—"}
		</div>
	);
}

function ScoreBar({ score, maxScore }: { score: number | null; maxScore: number }) {
	if (score == null) return <Minus size={14} style={{ color: "var(--color-text-muted)" }} />;

	const pct = maxScore > 0 ? Math.min((score / maxScore) * 100, 100) : 0;

	return (
		<div style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
			<div
				style={{
					flex: 1,
					height: 5,
					borderRadius: 3,
					background: "var(--color-bg-sunken)",
					overflow: "hidden",
				}}
			>
				<div
					style={{
						width: `${pct}%`,
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
					minWidth: 32,
					textAlign: "right",
				}}
			>
				{formatRiceScore(score)}
			</span>
		</div>
	);
}
