"use client";

import type { NoteQuote } from "@/lib/queries/vault";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, Trash2 } from "lucide-react";
import { useState } from "react";

interface QuoteHighlightPopoverProps {
	quote: NoteQuote;
	position: { x: number; y: number };
	onDelete: (quoteId: string, force: boolean) => void;
	onClose: () => void;
	workspaceId: string;
	projectId: string;
}

export function QuoteHighlightPopover({
	quote,
	position,
	onDelete,
	onClose,
	workspaceId,
	projectId,
}: QuoteHighlightPopoverProps) {
	const prefersReducedMotion = useReducedMotion();
	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const popoverWidth = 280;
	const popoverHeight = 160;
	const gap = 8;

	const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
	const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

	const rawX = position.x;
	const clampedX = Math.max(8, Math.min(rawX, viewportWidth - popoverWidth - 8));

	const rawY = position.y - popoverHeight - gap;
	const clampedY = Math.max(8, rawY < 8 ? position.y + gap + 24 : rawY);
	const isAbove = rawY >= 8;
	// If would overflow bottom when below, just cap it
	const finalY =
		!isAbove && clampedY + popoverHeight > viewportHeight
			? viewportHeight - popoverHeight - 8
			: clampedY;

	const style = {
		position: "fixed" as const,
		left: clampedX,
		top: finalY,
		zIndex: 9999,
		width: popoverWidth,
		pointerEvents: "auto" as const,
	};

	const motionProps = prefersReducedMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0 },
			}
		: {
				initial: { opacity: 0, scale: 0.95, y: 4 },
				animate: { opacity: 1, scale: 1, y: 0 },
				exit: { opacity: 0, scale: 0.95 },
				transition: { type: "spring" as const, stiffness: 500, damping: 30 },
			};

	const previewText = quote.text.length > 120 ? `${quote.text.slice(0, 120)}...` : quote.text;

	function handleDeleteClick() {
		if (quote.linkedInsightCount > 0 && !confirmingDelete) {
			setConfirmingDelete(true);
		} else {
			onDelete(quote.id, true);
			onClose();
		}
	}

	return (
		<AnimatePresence>
			<motion.div style={style} {...motionProps} data-quote-popover="true">
				<div className="rounded-lg border border-[--color-border-default] bg-[--color-bg-overlay] p-3 shadow-md">
					{/* Quote text preview */}
					<p className="font-body text-[0.8125rem] italic leading-normal text-[--color-text-secondary]">
						<span
							aria-hidden="true"
							className="mr-0.5 font-display text-[1.1rem] text-[--color-accent-gold] opacity-35"
						>
							"
						</span>
						{previewText}
						<span
							aria-hidden="true"
							className="ml-0.5 font-display text-[1.1rem] text-[--color-accent-gold] opacity-35"
						>
							"
						</span>
					</p>

					{/* Stale indicator */}
					{quote.isStale && (
						<p className="mt-1.5 font-mono text-[0.7rem] text-[--color-status-warning]">
							⚠ Content may have changed
						</p>
					)}

					{/* Linked insights count */}
					{quote.linkedInsightCount > 0 && (
						<p className="mt-1 font-mono text-[0.7rem] text-[--color-accent-blue]">
							{quote.linkedInsightCount} linked insight
							{quote.linkedInsightCount !== 1 ? "s" : ""}
						</p>
					)}

					{/* Separator */}
					<div className="meta-divider my-3" />

					{/* Actions */}
					{confirmingDelete ? (
						<div>
							<p className="mb-2.5 font-body text-[0.75rem] leading-snug text-[--color-text-secondary]">
								This quote is linked to {quote.linkedInsightCount} insight(s). Removing it will
								break the evidence chain. Continue?
							</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setConfirmingDelete(false)}
									className="flex-1 rounded border border-[--color-border-default] py-1 font-body text-xs text-[--color-text-secondary] transition-colors duration-100 hover:bg-[--color-bg-raised]"
								>
									Cancel
								</button>
								<button
									type="button"
									onClick={() => {
										onDelete(quote.id, true);
										onClose();
									}}
									className="flex-1 rounded border border-[--color-status-error] py-1 font-body text-xs text-[--color-status-error] transition-colors duration-100 hover:bg-[--color-status-error-bg]"
								>
									Remove anyway
								</button>
							</div>
						</div>
					) : (
						<div className="flex items-center justify-between">
							<button
								type="button"
								onClick={handleDeleteClick}
								className="flex items-center gap-1.5 rounded px-2 py-1 font-body text-[0.75rem] text-[--color-status-error] transition-colors duration-100 hover:bg-[--color-status-error-bg] focus:outline-none"
							>
								<Trash2 size={14} />
								Remove
							</button>

							{quote.linkedInsightCount > 0 && (
								<a
									href={`/${workspaceId}/${projectId}/engine?quote=${quote.id}`}
									className="flex items-center gap-1.5 rounded px-2 py-1 font-body text-[0.75rem] text-[--color-accent-blue] no-underline transition-colors duration-100 hover:bg-[--color-accent-blue-muted]"
									aria-label={`View ${quote.linkedInsightCount} linked insights`}
								>
									<ExternalLink size={14} />
									View Insights
								</a>
							)}
						</div>
					)}
				</div>
			</motion.div>
		</AnimatePresence>
	);
}
