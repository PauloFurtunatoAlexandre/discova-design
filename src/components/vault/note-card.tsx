"use client";

import type { NoteListItem } from "@/lib/queries/vault-list";
import { motion } from "framer-motion";
import { Flag, Lightbulb, Quote } from "lucide-react";
import { useRouter } from "next/navigation";

interface NoteCardProps {
	note: NoteListItem;
	workspaceId: string;
	projectId: string;
	index?: number;
}

const TONE_STYLES: Record<string, { color: string; label: string }> = {
	frustrated: { color: "var(--color-status-error)", label: "Frustrated" },
	delighted: { color: "var(--color-status-success)", label: "Delighted" },
	neutral: { color: "var(--color-text-muted)", label: "Neutral" },
	mixed: { color: "var(--color-status-warning)", label: "Mixed" },
};

const METHOD_LABELS: Record<string, string> = {
	interview: "Interview",
	survey: "Survey",
	usability_test: "Usability Test",
	observation: "Observation",
	other: "Other",
};

function formatDate(dateStr: string): string {
	try {
		const d = new Date(`${dateStr}T12:00:00`);
		return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
	} catch {
		return dateStr;
	}
}

export function NoteCard({ note, workspaceId, projectId, index = 0 }: NoteCardProps) {
	const router = useRouter();
	const tone = note.emotionalTone ? TONE_STYLES[note.emotionalTone] : null;
	const visibleTags = note.tags.slice(0, 3);
	const extraTags = note.tags.length - visibleTags.length;

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				delay: index * 0.03,
				duration: 0.22,
				ease: [0.25, 0.1, 0.25, 1],
			}}
			style={{ willChange: "opacity, transform" }}
		>
			<button
				type="button"
				onClick={() => router.push(`/${workspaceId}/${projectId}/vault/${note.id}`)}
				className="group/card block w-full rounded-xl border border-[--color-border-subtle] bg-[--color-bg-surface] px-5 py-4 text-left transition-all duration-150 hover:-translate-y-px hover:border-[--color-border-default] hover:shadow-card focus:outline-none focus-visible:ring-2"
			>
				{/* Row 1: participant + date · tone */}
				<div className="flex items-center justify-between gap-3">
					<div className="flex items-baseline gap-1.5 truncate">
						<span className="truncate font-body text-sm font-semibold text-[--color-text-primary]">
							{note.participantName}
						</span>
						<span className="text-[--color-text-muted]">·</span>
						<span className="whitespace-nowrap font-body text-sm text-[--color-text-secondary]">
							{formatDate(note.sessionDate)}
						</span>
					</div>

					{tone && (
						<div className="flex shrink-0 items-center gap-1.5">
							<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: tone.color }} />
							<span className="font-body text-[0.75rem] text-[--color-text-muted]">
								{tone.label}
							</span>
						</div>
					)}
				</div>

				{/* Row 2: content preview */}
				{note.rawContentPreview && (
					<p className="mt-2 line-clamp-2 font-body text-sm leading-[1.55] text-[--color-text-secondary]">
						{note.rawContentPreview}
					</p>
				)}

				{/* Row 3: metadata */}
				<div className="mt-3 flex items-center justify-between gap-3">
					{/* Left: method + tags */}
					<div className="flex flex-wrap items-center gap-1.5">
						{note.researchMethod && (
							<span className="rounded-full border border-[--color-accent-gold-border] bg-[--color-accent-gold-muted] px-2 py-0.5 font-mono text-[0.7rem] text-[--color-accent-gold]">
								{METHOD_LABELS[note.researchMethod] ?? note.researchMethod}
							</span>
						)}
						{visibleTags.map((tag) => (
							<span
								key={tag}
								className="rounded-full border border-[--color-border-subtle] bg-[--color-bg-raised] px-2 py-0.5 font-mono text-[0.7rem] text-[--color-text-muted]"
							>
								{tag}
							</span>
						))}
						{extraTags > 0 && (
							<span className="rounded-full border border-[--color-border-subtle] bg-[--color-bg-raised] px-2 py-0.5 font-mono text-[0.7rem] text-[--color-text-muted]">
								+{extraTags}
							</span>
						)}
					</div>

					{/* Right: counts + follow-up */}
					<div className="flex shrink-0 items-center gap-3">
						{note.quoteCount > 0 && (
							<span className="flex items-center gap-1 font-mono text-[0.7rem] text-[--color-accent-gold]">
								<Quote size={13} strokeWidth={1.5} />
								{note.quoteCount}
							</span>
						)}
						{note.insightCount > 0 && (
							<span className="flex items-center gap-1 font-mono text-[0.7rem] text-[--color-accent-blue]">
								<Lightbulb size={13} strokeWidth={1.5} />
								{note.insightCount}
							</span>
						)}
						{note.followUpNeeded && (
							<span className="flex items-center gap-1 font-mono text-[0.7rem] text-[--color-status-warning]">
								<Flag size={13} strokeWidth={1.5} />
								Follow-up
							</span>
						)}
					</div>
				</div>
			</button>
		</motion.div>
	);
}
