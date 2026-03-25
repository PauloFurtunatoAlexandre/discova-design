"use client";

import { CreateInsightForm } from "@/components/engine/create-insight-form";
import { InsightCard } from "@/components/engine/insight-card";
import { InsightCardExpanded } from "@/components/engine/insight-card-expanded";
import type { InsightWithRelations } from "@/lib/queries/engine";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface EnginePageClientProps {
	insights: InsightWithRelations[];
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
}

export function EnginePageClient({
	insights,
	workspaceId,
	projectId,
	canEdit,
}: EnginePageClientProps) {
	const router = useRouter();
	const [showCreate, setShowCreate] = useState(false);
	const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

	function handleCreated(_insightId: string) {
		setShowCreate(false);
		router.refresh();
	}

	return (
		<div className="p-8">
			{/* Page header */}
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: "1.5rem",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						Insight Engine
					</h1>
					<p
						className="mt-1"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.875rem",
							color: "var(--color-text-muted)",
						}}
					>
						{insights.length} insight{insights.length !== 1 ? "s" : ""}
					</p>
				</div>

				{canEdit && (
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-blue]"
						style={{
							fontFamily: "var(--font-body)",
							background: "var(--color-accent-blue)",
							color: "#fff",
						}}
					>
						<Plus size={14} />
						Create Insight
					</button>
				)}
			</div>

			{/* Insight list */}
			{insights.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<p
						className="mb-4"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.9375rem",
							color: "var(--color-text-muted)",
						}}
					>
						No insights yet. Analyse a research note or create one manually.
					</p>
					{canEdit && (
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="text-sm underline focus-visible:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								color: "var(--color-accent-blue)",
								background: "none",
								border: "none",
								cursor: "pointer",
							}}
						>
							Create insight
						</button>
					)}
				</div>
			) : (
				<div className="max-w-2xl">
					{insights.map((insight) => (
						<InsightCard
							key={insight.id}
							insight={insight}
							variant="compact"
							canEdit={canEdit}
							workspaceId={workspaceId}
							projectId={projectId}
							onClick={() => setExpandedInsightId(insight.id)}
						/>
					))}
				</div>
			)}

			{/* Expanded insight panel */}
			<AnimatePresence>
				{expandedInsightId && (
					<InsightCardExpanded
						key={expandedInsightId}
						insightId={expandedInsightId}
						workspaceId={workspaceId}
						projectId={projectId}
						canEdit={canEdit}
						onClose={() => setExpandedInsightId(null)}
						onDelete={() => {
							setExpandedInsightId(null);
							router.refresh();
						}}
					/>
				)}
			</AnimatePresence>

			{/* Create insight slide-over */}
			<AnimatePresence>
				{showCreate && (
					<CreateInsightForm
						key="create-form"
						workspaceId={workspaceId}
						projectId={projectId}
						onCreated={handleCreated}
						onClose={() => setShowCreate(false)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}
