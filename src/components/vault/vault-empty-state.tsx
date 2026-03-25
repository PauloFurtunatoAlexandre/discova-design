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
				<div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[--color-border-default] bg-[--color-bg-raised]">
					<SearchX size={24} className="text-[--color-text-muted]" strokeWidth={1.5} />
				</div>

				<h2 className="mb-2 text-lg font-semibold">No notes match your filters</h2>
				<p className="mb-6 max-w-xs text-sm leading-relaxed text-[--color-text-secondary]">
					Try adjusting your search or clearing some filters.
				</p>

				{onClearFilters && (
					<button
						type="button"
						onClick={onClearFilters}
						className="rounded-xl border border-[--color-border-default] px-5 py-2.5 font-body text-sm font-medium text-[--color-text-secondary] transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus:outline-none"
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
			<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[--color-accent-gold-border] bg-[--color-accent-gold-muted]">
				<FileText size={28} className="text-[--color-accent-gold]" strokeWidth={1.5} />
			</div>

			<h2 className="mb-2 max-w-xs text-xl font-semibold">{copy.headline}</h2>
			<p className="mb-8 max-w-xs text-sm leading-relaxed text-[--color-text-secondary]">
				{copy.body}
			</p>

			{canEdit && (
				<button
					type="button"
					onClick={() => router.push(`/${workspaceId}/${projectId}/vault/new`)}
					className="inline-flex items-center gap-2 rounded-xl bg-[--color-accent-gold] px-5 py-2.5 text-sm font-semibold text-[--color-text-inverse] transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none"
				>
					{copy.cta}
				</button>
			)}
		</div>
	);
}
