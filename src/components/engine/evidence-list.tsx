"use client";

import type { InsightWithRelations } from "@/lib/queries/engine";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EvidenceListProps {
	evidence: InsightWithRelations["evidence"];
	expanded: boolean;
	onToggle: () => void;
}

function formatDate(dateStr: string): string {
	try {
		return new Date(dateStr).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
			year: "numeric",
		});
	} catch {
		return dateStr;
	}
}

function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text;
	return `${text.slice(0, maxLen)}…`;
}

const uniqueNoteCount = (evidence: InsightWithRelations["evidence"]) =>
	new Set(evidence.map((e) => e.noteId)).size;

export function EvidenceList({ evidence, expanded, onToggle }: EvidenceListProps) {
	const prefersReducedMotion = useReducedMotion();

	const noteCount = uniqueNoteCount(evidence);
	const evidenceCount = evidence.length;

	return (
		<div>
			{/* Collapsed summary row */}
			<button
				type="button"
				onClick={onToggle}
				className="flex items-center gap-1.5 hover:underline focus-visible:outline-none"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.7rem",
					color: "var(--color-text-muted)",
					background: "none",
					border: "none",
					padding: 0,
					cursor: "pointer",
				}}
			>
				{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
				<span>
					{evidenceCount} evidence link{evidenceCount !== 1 ? "s" : ""} from {noteCount} note
					{noteCount !== 1 ? "s" : ""}
				</span>
			</button>

			{/* Expanded list */}
			<AnimatePresence initial={false}>
				{expanded && (
					<motion.div
						key="evidence-expanded"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={
							prefersReducedMotion
								? { duration: 0 }
								: { type: "spring", stiffness: 300, damping: 30 }
						}
						style={{ overflow: "hidden" }}
					>
						<div className="mt-3 flex flex-col gap-2">
							{evidence.map((ev, i) => (
								<motion.div
									key={ev.quoteId}
									initial={prefersReducedMotion ? {} : { opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									transition={prefersReducedMotion ? { duration: 0 } : { delay: i * 0.03 }}
									style={{
										paddingLeft: "10px",
										borderLeft: ev.isStale
											? "2px dashed var(--color-status-warning)"
											: "2px solid var(--color-accent-gold)",
									}}
								>
									{/* Quote text */}
									<p
										style={{
											fontFamily: "var(--font-body)",
											fontSize: "0.8125rem",
											fontStyle: "italic",
											color: "var(--color-text-secondary)",
											lineHeight: 1.5,
										}}
									>
										<span
											style={{
												fontFamily: "var(--font-serif)",
												color: "color-mix(in srgb, var(--color-accent-gold) 30%, transparent)",
											}}
										>
											"
										</span>
										{truncate(ev.quoteText, 80)}
										<span
											style={{
												fontFamily: "var(--font-serif)",
												color: "color-mix(in srgb, var(--color-accent-gold) 30%, transparent)",
											}}
										>
											"
										</span>
									</p>

									{/* Source line */}
									<p
										className="mt-0.5"
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: "0.65rem",
											color: "var(--color-text-muted)",
										}}
									>
										{ev.participantName} · {formatDate(ev.sessionDate)}
									</p>

									{/* Stale warning */}
									{ev.isStale && (
										<p
											className="mt-0.5 flex items-center gap-1"
											style={{
												fontFamily: "var(--font-body)",
												fontSize: "0.65rem",
												color: "var(--color-status-warning)",
											}}
										>
											⚠ Source content may have changed
										</p>
									)}
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
