"use client";

import type { AISuggestion, AnalysisState } from "@/lib/engine/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ProcessingAnimation } from "./processing-animation";
import { SuggestionCardPreview } from "./suggestion-card-preview";

interface AnalysisViewProps {
	state: AnalysisState;
	suggestions: AISuggestion[];
	onDismiss: (id: string) => void;
	onRetry: () => void;
	onSuggestionAccepted?: (suggestion: AISuggestion) => void;
}

export function AnalysisView({
	state,
	suggestions,
	onDismiss,
	onRetry,
	onSuggestionAccepted,
}: AnalysisViewProps) {
	const prefersReducedMotion = useReducedMotion();

	if (state.status === "idle") return null;

	return (
		<div className="mb-6">
			<AnimatePresence mode="wait">
				{/* Reading / analysing state → processing animation */}
				{(state.status === "reading" || state.status === "analysing") && (
					<ProcessingAnimation
						key="processing"
						status={state.status}
						currentParagraph={state.status === "reading" ? state.currentParagraph : undefined}
						totalParagraphs={state.status === "reading" ? state.totalParagraphs : undefined}
						statusText={state.status === "reading" ? "Reading your notes..." : state.statusText}
					/>
				)}

				{/* Complete → suggestion cards */}
				{(state.status === "complete" || state.status === "streaming") && (
					<motion.div
						key="suggestions"
						initial={prefersReducedMotion ? {} : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
					>
						{suggestions.length === 0 ? (
							<p
								className="py-6 text-center"
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.875rem",
									color: "var(--color-text-muted)",
								}}
							>
								No insights found in this note. Try adding more content or details.
							</p>
						) : (
							suggestions.map((s, i) => (
								<SuggestionCardPreview
									key={s.id}
									suggestion={s}
									index={i}
									onDismiss={onDismiss}
									onAccept={onSuggestionAccepted}
								/>
							))
						)}
					</motion.div>
				)}

				{/* Error state */}
				{state.status === "error" && (
					<motion.div
						key="error"
						initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="flex items-center gap-3 rounded-xl px-4 py-3"
						style={{
							background: "color-mix(in srgb, var(--color-status-error) 8%, transparent)",
							border: "1px solid color-mix(in srgb, var(--color-status-error) 20%, transparent)",
						}}
					>
						<p
							className="flex-1"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-status-error)",
							}}
						>
							{state.message}
						</p>
						{state.canRetry && (
							<button
								type="button"
								onClick={onRetry}
								className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-white/5 focus:outline-none"
								style={{
									fontFamily: "var(--font-body)",
									color: "var(--color-accent-blue)",
									border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
								}}
							>
								Try again
							</button>
						)}
					</motion.div>
				)}

				{/* Rate limited state */}
				{state.status === "rate_limited" && (
					<motion.div
						key="rate-limited"
						initial={prefersReducedMotion ? {} : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0 }}
						className="rounded-xl px-4 py-3"
						style={{
							background: "color-mix(in srgb, var(--color-text-muted) 8%, transparent)",
							border: "1px solid color-mix(in srgb, var(--color-text-muted) 20%, transparent)",
						}}
					>
						<p
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-text-muted)",
							}}
						>
							You've reached the analysis limit. Try again in{" "}
							{Math.ceil(state.retryAfterSeconds / 60)} minutes.
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
