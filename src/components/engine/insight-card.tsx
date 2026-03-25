"use client";

import { deleteInsightAction, updateInsightAction } from "@/actions/insights";
import type { InsightWithRelations } from "@/lib/queries/engine";
import { AnimatePresence, motion } from "framer-motion";
import { Edit2, Quote, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ConfidenceRing } from "./confidence-ring";
import { EvidenceList } from "./evidence-list";

export interface InsightCardProps {
	insight: InsightWithRelations;
	variant?: "compact" | "full" | "inline" | undefined;
	canEdit?: boolean | undefined;
	onEdit?: (() => void) | undefined;
	onDelete?: (() => void) | undefined;
	onClick?: (() => void) | undefined;
	workspaceId?: string | undefined;
	projectId?: string | undefined;
}

// ─── Time-ago helper ──────────────────────────────────────────────────────────

function timeAgo(date: Date | string): string {
	const now = Date.now();
	const d = new Date(date).getTime();
	const diffSec = Math.floor((now - d) / 1000);
	if (diffSec < 60) return "just now";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Attribution line ─────────────────────────────────────────────────────────

function Attribution({ insight }: { insight: InsightWithRelations }) {
	const age = timeAgo(insight.createdAt);
	if (insight.isAiGenerated && insight.acceptedBy) {
		return (
			<span>
				AI · Accepted by {insight.acceptedBy.name} · {age}
			</span>
		);
	}
	return (
		<span>
			{insight.createdBy.name} · {age}
		</span>
	);
}

// ─── Compact Variant ──────────────────────────────────────────────────────────

function CompactCard({
	insight,
	canEdit,
	onDelete,
	onClick,
	workspaceId,
	projectId,
}: InsightCardProps) {
	const router = useRouter();
	const isConnected = insight.isConnectedToMap;

	return (
		<motion.div
			whileHover={{ y: -1 }}
			transition={{ duration: 0.12 }}
			onClick={onClick}
			className="mb-3 cursor-pointer overflow-hidden"
			style={{
				background: "var(--color-bg-surface)",
				border: isConnected
					? "1px solid var(--color-border-subtle)"
					: "1px dashed var(--color-border-default)",
				borderLeft: isConnected
					? "3px solid var(--color-accent-blue)"
					: "3px dashed color-mix(in srgb, var(--color-accent-blue) 50%, transparent)",
				borderRadius: "var(--radius-lg)",
				padding: "14px 18px",
				opacity: isConnected ? 1 : 0.85,
				boxShadow: "none",
				transition: "box-shadow 0.15s ease, border-color 0.15s ease",
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)";
				(e.currentTarget as HTMLElement).style.borderColor = isConnected
					? "var(--color-border-default)"
					: "var(--color-border-default)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLElement).style.boxShadow = "none";
			}}
		>
			{/* Statement */}
			<p
				className="mb-2 line-clamp-2"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.875rem",
					fontWeight: 500,
					color: "var(--color-text-primary)",
					lineHeight: 1.5,
				}}
			>
				{insight.statement}
			</p>

			{/* Metadata row */}
			<div className="mb-2 flex flex-wrap items-center gap-3">
				{/* Confidence ring */}
				<ConfidenceRing score={insight.confidenceScore} size="sm" animated={false} />

				{/* Theme tag */}
				{insight.themeTag && (
					<span
						className="rounded-full px-2 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							background: "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)",
							color: "var(--color-accent-blue)",
						}}
					>
						{insight.themeTag}
					</span>
				)}

				{/* Evidence count */}
				<span
					className="flex items-center gap-1"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.65rem",
						color: "var(--color-text-muted)",
					}}
				>
					<Quote size={11} style={{ color: "var(--color-accent-gold)" }} />
					{insight.evidenceCount} evidence
				</span>

				{/* Problem link */}
				{insight.linkedProblem && workspaceId && projectId && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							router.push(`/${workspaceId}/${projectId}/map`);
						}}
						className="max-w-[140px] truncate hover:underline focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							color: "var(--color-accent-coral)",
							background: "none",
							border: "none",
							padding: 0,
							cursor: "pointer",
						}}
					>
						→ {insight.linkedProblem.label}
					</button>
				)}

				{/* Unconnected badge */}
				{!isConnected && (
					<span
						className="rounded-full px-2 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							background: "var(--color-bg-sunken)",
							color: "var(--color-text-muted)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						Unconnected
					</span>
				)}
			</div>

			{/* Attribution */}
			<p
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.65rem",
					color: "var(--color-text-muted)",
				}}
			>
				<Attribution insight={insight} />
			</p>
		</motion.div>
	);
}

// ─── Full Variant ─────────────────────────────────────────────────────────────

function FullCard({ insight, canEdit, onDelete, workspaceId, projectId }: InsightCardProps) {
	const router = useRouter();
	const [isEditing, setIsEditing] = useState(false);
	const [editStatement, setEditStatement] = useState(insight.statement);
	const [editThemeTag, setEditThemeTag] = useState(insight.themeTag ?? "");
	const [isSaving, setIsSaving] = useState(false);
	const [editError, setEditError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [evidenceExpanded, setEvidenceExpanded] = useState(true);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	async function handleSave() {
		if (!workspaceId || !projectId) return;
		setIsSaving(true);
		setEditError(null);
		const result = await updateInsightAction({
			workspaceId,
			projectId,
			insightId: insight.id,
			statement: editStatement,
			themeTag: editThemeTag,
		});
		setIsSaving(false);
		if ("error" in result) {
			setEditError(result.error);
			return;
		}
		setIsEditing(false);
	}

	async function handleDelete() {
		if (!workspaceId || !projectId) return;
		setIsDeleting(true);
		const result = await deleteInsightAction({
			workspaceId,
			projectId,
			insightId: insight.id,
		});
		setIsDeleting(false);
		if ("error" in result) {
			setEditError(result.error);
			setConfirmDelete(false);
			return;
		}
		onDelete?.();
	}

	return (
		<div
			style={{
				background: "var(--color-bg-surface)",
				border: "1px solid var(--color-border-subtle)",
				borderLeft: "3px solid var(--color-accent-blue)",
				borderRadius: "var(--radius-lg)",
				padding: "20px 24px",
			}}
		>
			{/* Header row: ring + statement + actions */}
			<div className="mb-4 flex items-start gap-4">
				<div className="shrink-0">
					<ConfidenceRing score={insight.confidenceScore} size="lg" />
				</div>

				<div className="flex-1">
					{isEditing ? (
						<textarea
							ref={textareaRef}
							aria-label="Insight statement"
							value={editStatement}
							onChange={(e) => setEditStatement(e.target.value)}
							rows={3}
							maxLength={500}
							className="mb-2 w-full resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.9375rem",
								fontWeight: 500,
								color: "var(--color-text-primary)",
								background: "var(--color-bg-sunken)",
								border: "1px solid var(--color-accent-blue)",
							}}
						/>
					) : (
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.9375rem",
								fontWeight: 500,
								color: "var(--color-text-primary)",
								lineHeight: 1.6,
							}}
						>
							{insight.statement}
						</p>
					)}

					{/* Tags row */}
					<div className="mb-2 flex flex-wrap items-center gap-2">
						{isEditing ? (
							<input
								type="text"
								value={editThemeTag}
								onChange={(e) => setEditThemeTag(e.target.value)}
								placeholder="theme tag"
								maxLength={50}
								className="rounded-full px-2.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
								style={{
									fontFamily: "var(--font-mono)",
									background: "color-mix(in srgb, var(--color-accent-blue) 14%, transparent)",
									color: "var(--color-accent-blue)",
									border: "1px solid var(--color-accent-blue)",
								}}
							/>
						) : (
							insight.themeTag && (
								<span
									className="rounded-full px-2.5 py-0.5"
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "0.7rem",
										background: "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)",
										color: "var(--color-accent-blue)",
									}}
								>
									{insight.themeTag}
								</span>
							)
						)}
					</div>

					{/* Attribution */}
					<p
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							color: "var(--color-text-muted)",
						}}
					>
						<Attribution insight={insight} />
					</p>
				</div>

				{/* Action buttons */}
				{canEdit && !isEditing && (
					<div className="flex items-center gap-1">
						<button
							type="button"
							aria-label="Edit insight"
							onClick={() => setIsEditing(true)}
							className="rounded-md p-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none"
							style={{ color: "var(--color-text-muted)" }}
						>
							<Edit2 size={14} />
						</button>
						<button
							type="button"
							aria-label="Delete insight"
							onClick={() => setConfirmDelete(true)}
							className="rounded-md p-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none"
							style={{ color: "var(--color-status-error)" }}
						>
							<Trash2 size={14} />
						</button>
					</div>
				)}
			</div>

			{/* Edit error */}
			{editError && (
				<p
					className="mb-3 text-xs"
					style={{ color: "var(--color-status-error)", fontFamily: "var(--font-body)" }}
				>
					{editError}
				</p>
			)}

			{/* Edit actions */}
			{isEditing && (
				<div className="mb-4 flex gap-2">
					<button
						type="button"
						onClick={handleSave}
						disabled={isSaving || !editStatement.trim()}
						className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40 focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							background: "var(--color-accent-blue)",
							color: "#fff",
						}}
					>
						{isSaving ? "Saving…" : "Save"}
					</button>
					<button
						type="button"
						onClick={() => {
							setIsEditing(false);
							setEditStatement(insight.statement);
							setEditThemeTag(insight.themeTag ?? "");
							setEditError(null);
						}}
						className="rounded-lg px-3 py-1.5 text-xs focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							color: "var(--color-text-muted)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						Cancel
					</button>
				</div>
			)}

			{/* Delete confirmation */}
			<AnimatePresence>
				{confirmDelete && (
					<motion.div
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="mb-4 flex items-center gap-3 rounded-lg px-3 py-2"
						style={{
							background: "color-mix(in srgb, var(--color-status-error) 8%, transparent)",
							border: "1px solid color-mix(in srgb, var(--color-status-error) 20%, transparent)",
						}}
					>
						<span
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-status-error)",
								flex: 1,
							}}
						>
							Delete this insight permanently?
						</span>
						<button
							type="button"
							onClick={handleDelete}
							disabled={isDeleting}
							className="rounded-md px-2.5 py-1 text-xs font-semibold focus-visible:outline-none disabled:opacity-40"
							style={{
								fontFamily: "var(--font-body)",
								background: "var(--color-status-error)",
								color: "#fff",
							}}
						>
							{isDeleting ? "Deleting…" : "Delete"}
						</button>
						<button
							type="button"
							onClick={() => setConfirmDelete(false)}
							className="rounded-md p-1 transition-colors hover:bg-white/5 focus-visible:outline-none"
							style={{ color: "var(--color-text-muted)" }}
						>
							<X size={14} />
						</button>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Problem link */}
			{insight.linkedProblem && workspaceId && projectId && (
				<div className="mb-4">
					<p
						className="mb-1"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						Related Problem
					</p>
					<button
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/map`)}
						className="hover:underline focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.875rem",
							color: "var(--color-accent-coral)",
							background: "none",
							border: "none",
							padding: 0,
							cursor: "pointer",
						}}
					>
						→ {insight.linkedProblem.label}
					</button>
				</div>
			)}

			{/* Evidence list */}
			{insight.evidence.length > 0 && (
				<EvidenceList
					evidence={insight.evidence}
					expanded={evidenceExpanded}
					onToggle={() => setEvidenceExpanded((v) => !v)}
				/>
			)}
		</div>
	);
}

// ─── Inline Variant ───────────────────────────────────────────────────────────

function InlineCard({ insight }: InsightCardProps) {
	return (
		<div className="flex items-center gap-2">
			<ConfidenceRing score={insight.confidenceScore} size="sm" animated={false} />
			<span
				className="flex-1 truncate"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.8125rem",
					fontWeight: 500,
					color: "var(--color-text-primary)",
				}}
			>
				{insight.statement}
			</span>
			<span
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.65rem",
					color: "var(--color-text-muted)",
					whiteSpace: "nowrap",
				}}
			>
				{insight.evidenceCount} evidence
			</span>
		</div>
	);
}

// ─── Public Component ─────────────────────────────────────────────────────────

export function InsightCard(props: InsightCardProps) {
	const { variant = "compact" } = props;

	if (variant === "inline") return <InlineCard {...props} />;
	if (variant === "full") return <FullCard {...props} />;
	return <CompactCard {...props} />;
}
