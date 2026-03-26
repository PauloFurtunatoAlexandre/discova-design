"use client";

import { placeInsightOnMapAction } from "@/actions/map";
import type { UnplacedInsight } from "@/lib/queries/map";
import { ChevronRight, Lightbulb, Sparkles } from "lucide-react";
import { useState, useTransition } from "react";

interface UnplacedInsightsPanelProps {
	insights: UnplacedInsight[];
	isOpen: boolean;
	onToggle: () => void;
	workspaceId: string;
	projectId: string;
}

export function UnplacedInsightsPanel({
	insights,
	isOpen,
	onToggle,
	workspaceId,
	projectId,
}: UnplacedInsightsPanelProps) {
	if (insights.length === 0) return null;

	return (
		<div
			className="absolute right-4 top-4 z-20 flex flex-col"
			style={{
				width: isOpen ? 320 : "auto",
				maxHeight: "calc(100% - 2rem)",
			}}
		>
			{/* Toggle button */}
			<button
				type="button"
				onClick={onToggle}
				className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
				style={{
					backgroundColor: "var(--color-bg-overlay)",
					border: "1px solid var(--color-border-default)",
					boxShadow: "var(--shadow-sm)",
					color: "var(--color-text-primary)",
					fontFamily: "var(--font-body)",
					fontSize: "var(--text-sm)",
					fontWeight: 500,
				}}
			>
				<Lightbulb size={16} style={{ color: "var(--color-accent-blue)" }} />
				<span>Unplaced Insights</span>
				<span
					className="ml-auto flex items-center justify-center rounded-full"
					style={{
						width: 20,
						height: 20,
						backgroundColor: "var(--color-accent-blue)",
						color: "var(--color-text-inverse)",
						fontFamily: "var(--font-mono)",
						fontSize: "10px",
						fontWeight: 600,
					}}
				>
					{insights.length}
				</span>
				<ChevronRight
					size={14}
					style={{
						color: "var(--color-text-muted)",
						transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
						transition: "transform 150ms ease-out",
					}}
				/>
			</button>

			{/* Panel */}
			{isOpen && (
				<div
					className="mt-2 flex flex-col gap-1 overflow-y-auto rounded-lg p-2"
					style={{
						backgroundColor: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-md)",
						maxHeight: 400,
					}}
				>
					{insights.map((insight) => (
						<UnplacedInsightRow
							key={insight.id}
							insight={insight}
							workspaceId={workspaceId}
							projectId={projectId}
						/>
					))}
				</div>
			)}
		</div>
	);
}

function UnplacedInsightRow({
	insight,
	workspaceId,
	projectId,
}: {
	insight: UnplacedInsight;
	workspaceId: string;
	projectId: string;
}) {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);

	function handlePlace() {
		setError(null);
		startTransition(async () => {
			const result = await placeInsightOnMapAction({
				workspaceId,
				projectId,
				insightId: insight.id,
			});
			if ("error" in result) {
				setError(result.error);
			}
		});
	}

	return (
		<div
			className="flex items-start gap-2 rounded-md px-3 py-2.5 transition-colors"
			style={{
				backgroundColor: "transparent",
			}}
		>
			<Sparkles
				size={14}
				className="mt-0.5 shrink-0"
				style={{ color: "var(--color-accent-blue)" }}
			/>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span
					className="line-clamp-2"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-primary)",
						lineHeight: 1.4,
					}}
				>
					{insight.statement}
				</span>
				{insight.themeTag && (
					<span
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "10px",
							color: "var(--color-text-muted)",
						}}
					>
						{insight.themeTag}
					</span>
				)}
				{error && (
					<span
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "10px",
							color: "var(--color-status-error)",
						}}
					>
						{error}
					</span>
				)}
			</div>
			<button
				type="button"
				onClick={handlePlace}
				disabled={isPending}
				className="shrink-0 rounded-md px-2 py-1 transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "10px",
					fontWeight: 600,
					color: "var(--color-text-inverse)",
					backgroundColor: "var(--color-accent-blue)",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
				}}
			>
				{isPending ? "..." : "Place"}
			</button>
		</div>
	);
}
