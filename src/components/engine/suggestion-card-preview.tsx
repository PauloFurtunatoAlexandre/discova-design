"use client";

import type { AISuggestion } from "@/lib/engine/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Edit2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SuggestionCardPreviewProps {
	suggestion: AISuggestion;
	index: number;
	onDismiss: (id: string) => void;
	/** Stub — fully implemented in Prompt 16 */
	onAccept?: ((suggestion: AISuggestion) => void) | undefined;
	/** Stub — fully implemented in Prompt 16 */
	onEdit?: ((suggestion: AISuggestion) => void) | undefined;
}

const CONFIDENCE_STYLES: Record<
	AISuggestion["confidence"],
	{ color: string; bg: string; label: string }
> = {
	high: {
		color: "var(--color-status-success)",
		bg: "color-mix(in srgb, var(--color-status-success) 12%, transparent)",
		label: "high confidence",
	},
	medium: {
		color: "var(--color-status-warning)",
		bg: "color-mix(in srgb, var(--color-status-warning) 12%, transparent)",
		label: "medium confidence",
	},
	low: {
		color: "var(--color-text-muted)",
		bg: "color-mix(in srgb, var(--color-text-muted) 12%, transparent)",
		label: "low confidence",
	},
};

export function SuggestionCardPreview({
	suggestion,
	index,
	onDismiss,
	onAccept,
	onEdit,
}: SuggestionCardPreviewProps) {
	const prefersReducedMotion = useReducedMotion();
	const [isDismissing, setIsDismissing] = useState(false);
	const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);
	const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const confidence = CONFIDENCE_STYLES[suggestion.confidence];

	// Cleanup timers on unmount
	useEffect(() => {
		return () => {
			if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
			if (countdownRef.current) clearInterval(countdownRef.current);
		};
	}, []);

	function handleDismiss() {
		setIsDismissing(true);
		setUndoSecondsLeft(5);

		countdownRef.current = setInterval(() => {
			setUndoSecondsLeft((prev) => {
				if (prev <= 1) {
					if (countdownRef.current) clearInterval(countdownRef.current);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		dismissTimerRef.current = setTimeout(() => {
			onDismiss(suggestion.id);
		}, 5000);
	}

	function handleUndo() {
		setIsDismissing(false);
		setUndoSecondsLeft(0);
		if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
		if (countdownRef.current) clearInterval(countdownRef.current);
	}

	const entranceTransition = prefersReducedMotion
		? { duration: 0 }
		: {
				type: "spring" as const,
				stiffness: 300,
				damping: 25,
				delay: index * 0.15,
			};

	return (
		<>
			<AnimatePresence>
				{!isDismissing && (
					<motion.div
						layout
						initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, scale: 0.95, transition: { duration: 0.18 } }
						}
						transition={entranceTransition}
						className="mb-3"
						style={{
							background: "var(--color-bg-surface)",
							border: "1px solid color-mix(in srgb, var(--color-accent-blue) 28%, transparent)",
							borderRadius: "var(--radius-lg)",
							padding: "16px 20px",
						}}
					>
						{/* Statement */}
						<p
							className="mb-4"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.9375rem",
								fontWeight: 500,
								color: "var(--color-text-primary)",
								lineHeight: 1.5,
							}}
						>
							{suggestion.statement}
						</p>

						{/* Supporting evidence */}
						{suggestion.supportingEvidence.length > 0 && (
							<div className="mb-4">
								<p
									className="mb-1.5"
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "0.65rem",
										color: "var(--color-text-muted)",
										textTransform: "uppercase",
										letterSpacing: "0.08em",
									}}
								>
									Evidence
								</p>
								<div className="flex flex-col gap-1.5">
									{suggestion.supportingEvidence.map((ev, i) => (
										<p
											// biome-ignore lint/suspicious/noArrayIndexKey: evidence is positional
											key={i}
											style={{
												fontFamily: "var(--font-body)",
												fontSize: "0.8125rem",
												fontStyle: "italic",
												color: "var(--color-text-secondary)",
												lineHeight: 1.5,
											}}
										>
											<span style={{ color: "var(--color-accent-gold)" }}>"</span>
											{ev.quoteText}
											<span style={{ color: "var(--color-accent-gold)" }}>"</span>
										</p>
									))}
								</div>
							</div>
						)}

						{/* Tags row */}
						<div className="mb-4 flex flex-wrap items-center gap-2">
							{/* Theme tag */}
							<span
								className="rounded-full px-2.5 py-0.5"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.7rem",
									background: "color-mix(in srgb, var(--color-accent-blue) 14%, transparent)",
									color: "var(--color-accent-blue)",
								}}
							>
								{suggestion.suggestedThemeTag}
							</span>

							{/* Confidence badge */}
							<span
								className="rounded-full px-2.5 py-0.5"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.7rem",
									background: confidence.bg,
									color: confidence.color,
								}}
							>
								{confidence.label}
							</span>
						</div>

						{/* Actions row */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								{/* Accept — stub, fully functional in Prompt 16 */}
								<button
									type="button"
									onClick={() => onAccept?.(suggestion)}
									className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
									style={{
										fontFamily: "var(--font-body)",
										background: "var(--color-status-success)",
										color: "var(--color-text-inverse)",
									}}
								>
									<CheckCircle size={12} strokeWidth={2.5} />
									Accept
								</button>

								{/* Edit — stub, fully functional in Prompt 16 */}
								<button
									type="button"
									onClick={() => onEdit?.(suggestion)}
									className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
									style={{
										fontFamily: "var(--font-body)",
										color: "var(--color-text-muted)",
										border: "1px solid var(--color-border-subtle)",
									}}
								>
									<Edit2 size={11} strokeWidth={2} />
									Edit
								</button>

								{/* Dismiss */}
								<button
									type="button"
									onClick={handleDismiss}
									className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
									style={{
										fontFamily: "var(--font-body)",
										color: "var(--color-text-muted)",
									}}
								>
									<X size={11} strokeWidth={2} />
									Dismiss
								</button>
							</div>

							{/* AI attribution */}
							<div className="flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
								<Sparkles size={12} style={{ color: "var(--color-accent-blue)" }} />
								<span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
									AI suggestion
								</span>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			{/* Undo toast */}
			<AnimatePresence>
				{isDismissing && (
					<motion.div
						initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
						transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
						className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl px-4 py-3 shadow-lg"
						style={{
							background: "var(--color-bg-overlay)",
							border: "1px solid var(--color-border-default)",
							boxShadow: "var(--shadow-modal)",
						}}
					>
						<span
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-text-secondary)",
							}}
						>
							Insight dismissed
						</span>
						<button
							type="button"
							onClick={handleUndo}
							className="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
							style={{
								fontFamily: "var(--font-body)",
								color: "var(--color-accent-blue)",
							}}
						>
							Undo ({undoSecondsLeft}s)
						</button>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	);
}
