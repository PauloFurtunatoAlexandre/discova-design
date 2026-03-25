"use client";

import type { ResolvedPreset } from "@/lib/permissions/types";
import { FileText, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";

interface VaultEmptyStateProps {
	preset: ResolvedPreset;
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
	noResults?: boolean;
	onClearFilters?: () => void;
}

interface EmptyStateCopy {
	headline: string;
	body: string;
	cta: string;
}

function getEmptyCopy(preset: ResolvedPreset): EmptyStateCopy {
	switch (preset) {
		case "researcher":
			return {
				headline: "Start with an interview note",
				body: "Capture your first research session. Every insight starts here.",
				cta: "Add interview note →",
			};
		case "pm":
			return {
				headline: "Paste in your last user feedback",
				body: "Drop in feedback from your latest user conversation to start building your evidence chain.",
				cta: "Add feedback →",
			};
		default:
			return {
				headline: "Your research vault is empty",
				body: "Add your first research note to begin building your evidence chain.",
				cta: "Add your first note →",
			};
	}
}

export function VaultEmptyState({
	preset,
	workspaceId,
	projectId,
	canEdit,
	noResults = false,
	onClearFilters,
}: VaultEmptyStateProps) {
	const router = useRouter();

	if (noResults) {
		return (
			<div className="flex flex-col items-center justify-center py-20 text-center">
				<div
					className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
					style={{
						background: "var(--color-bg-raised)",
						border: "1px solid var(--color-border-default)",
					}}
				>
					<SearchX size={24} style={{ color: "var(--color-text-muted)" }} strokeWidth={1.5} />
				</div>

				<h2
					className="mb-2 text-lg font-semibold"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					No notes match your filters
				</h2>
				<p
					className="mb-6 max-w-xs text-sm leading-relaxed"
					style={{ color: "var(--color-text-secondary)" }}
				>
					Try adjusting your search or clearing some filters.
				</p>

				{onClearFilters && (
					<button
						type="button"
						onClick={onClearFilters}
						className="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-white/5 focus:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							color: "var(--color-text-secondary)",
							borderColor: "var(--color-border-default)",
						}}
					>
						Clear all filters
					</button>
				)}
			</div>
		);
	}

	const copy = getEmptyCopy(preset);

	return (
		<div className="flex flex-col items-center justify-center py-20 text-center">
			{/* Icon */}
			<div
				className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
				style={{
					background: "var(--color-accent-gold-muted)",
					border: "1px solid var(--color-accent-gold-border)",
				}}
			>
				<FileText size={28} style={{ color: "var(--color-accent-gold)" }} strokeWidth={1.5} />
			</div>

			<h2
				className="mb-2 max-w-xs text-xl font-semibold"
				style={{
					fontFamily: "var(--font-display)",
					color: "var(--color-text-primary)",
				}}
			>
				{copy.headline}
			</h2>
			<p
				className="mb-8 max-w-xs text-sm leading-relaxed"
				style={{ color: "var(--color-text-secondary)" }}
			>
				{copy.body}
			</p>

			{canEdit && (
				<button
					type="button"
					onClick={() => router.push(`/${workspaceId}/${projectId}/vault/new`)}
					className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none"
					style={{
						background: "var(--color-accent-gold)",
						color: "var(--color-text-inverse)",
					}}
				>
					{copy.cta}
				</button>
			)}
		</div>
	);
}
