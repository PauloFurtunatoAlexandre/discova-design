"use client";

import { acceptInsightAction } from "@/actions/insights";
import type { AISuggestion } from "@/lib/engine/types";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckCircle, Edit2, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InlineProblemLinker } from "./inline-problem-linker";

type CardMode = "viewing" | "editing" | "accepting" | "linking" | "accepted";

interface SuggestionCardProps {
	suggestion: AISuggestion;
	noteId: string;
	workspaceId: string;
	projectId: string;
	index: number;
	onAccepted: (insightId: string) => void;
	onDismissed: (suggestionId: string) => void;
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

export function SuggestionCard({
	suggestion,
	noteId,
	workspaceId,
	projectId,
	index,
	onAccepted,
	onDismissed,
}: SuggestionCardProps) {
	const prefersReducedMotion = useReducedMotion();
	const [mode, setMode] = useState<CardMode>("viewing");
	const [editedStatement, setEditedStatement] = useState(suggestion.statement);
	const [editedThemeTag, setEditedThemeTag] = useState(suggestion.suggestedThemeTag);
	// Statement that was actually accepted (may differ if user edited)
	const [displayStatement, setDisplayStatement] = useState(suggestion.statement);
	const [createdInsightId, setCreatedInsightId] = useState<string | null>(null);
	const [linkedProblemLabel, setLinkedProblemLabel] = useState<string | null>(null);
	const [isDismissing, setIsDismissing] = useState(false);
	const [undoSecondsLeft, setUndoSecondsLeft] = useState(0);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isFaded, setIsFaded] = useState(false);

	const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const confidence = CONFIDENCE_STYLES[suggestion.confidence];
	const isAccepted = mode === "accepted";
	const accentColor = isAccepted ? "var(--color-status-success)" : "var(--color-accent-blue)";

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
			if (countdownRef.current) clearInterval(countdownRef.current);
			if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
		};
	}, []);

	// Auto-focus textarea in editing mode, cursor at end
	useEffect(() => {
		if (mode === "editing" && textareaRef.current) {
			textareaRef.current.focus();
			const len = textareaRef.current.value.length;
			textareaRef.current.setSelectionRange(len, len);
		}
	}, [mode]);

	// Fade to 70% opacity 3 seconds after accepted
	useEffect(() => {
		if (mode === "accepted") {
			fadeTimerRef.current = setTimeout(() => setIsFaded(true), 3000);
		}
	}, [mode]);

	async function doAccept(statement: string, themeTag: string) {
		setSubmitError(null);
		setMode("accepting");

		const result = await acceptInsightAction({
			workspaceId,
			projectId,
			noteId,
			statement,
			themeTag: themeTag || null,
			isAiGenerated: true,
			evidenceQuoteIds: [],
			evidenceSpans: suggestion.supportingEvidence.map((ev) => ({
				quoteText: ev.quoteText,
				startOffset: ev.startOffset,
				endOffset: ev.endOffset,
			})),
			problemNodeId: null,
		});

		if ("error" in result) {
			setSubmitError(result.error);
			setMode("viewing");
			return;
		}

		setDisplayStatement(statement);
		setCreatedInsightId(result.insightId);
		setMode("linking");
	}

	function handleLinked(problemNodeId: string, problemLabel: string) {
		setLinkedProblemLabel(problemLabel);
		setMode("accepted");
		if (createdInsightId) onAccepted(createdInsightId);
		// silence unused warning — problemNodeId is for future use
		void problemNodeId;
	}

	function handleSkipped() {
		setMode("accepted");
		if (createdInsightId) onAccepted(createdInsightId);
	}

	function handleNewProblemCreated(problemNodeId: string, problemLabel: string) {
		setLinkedProblemLabel(problemLabel);
		setMode("accepted");
		if (createdInsightId) onAccepted(createdInsightId);
		void problemNodeId;
	}

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
			onDismissed(suggestion.id);
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
		: { type: "spring" as const, stiffness: 300, damping: 25, delay: index * 0.15 };

	return (
		<>
			<AnimatePresence>
				{!isDismissing && (
					<motion.div
						layout
						initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
						animate={{ opacity: isFaded ? 0.7 : 1, y: 0 }}
						exit={
							prefersReducedMotion
								? { opacity: 0 }
								: { opacity: 0, scale: 0.95, transition: { duration: 0.18 } }
						}
						transition={entranceTransition}
						className="mb-3 overflow-hidden"
						style={{
							background: "var(--color-bg-surface)",
							border: `1px solid color-mix(in srgb, ${accentColor} 22%, transparent)`,
							borderLeft: `3px solid ${accentColor}`,
							borderRadius: "var(--radius-lg)",
							transition: isFaded ? "opacity 1s ease" : undefined,
						}}
					>
						{/* ── Card content ─────────────────────────────── */}
						<div style={{ padding: "16px 20px" }}>
							{/* Accepted badge */}
							{isAccepted && (
								<div className="mb-3 flex items-center gap-2 flex-wrap">
									<CheckCircle
										size={14}
										strokeWidth={2.5}
										style={{ color: "var(--color-status-success)" }}
									/>
									<span
										style={{
											fontFamily: "var(--font-body)",
											fontSize: "0.8125rem",
											fontWeight: 600,
											color: "var(--color-status-success)",
										}}
									>
										Insight created
									</span>
									{linkedProblemLabel && (
										<span
											style={{
												fontFamily: "var(--font-body)",
												fontSize: "0.8125rem",
												color: "var(--color-accent-coral)",
											}}
										>
											· Linked to: {linkedProblemLabel}
										</span>
									)}
								</div>
							)}

							{/* Statement — editable in edit mode */}
							{mode === "editing" ? (
								<textarea
									aria-label="Insight statement"
									ref={textareaRef}
									value={editedStatement}
									onChange={(e) => setEditedStatement(e.target.value)}
									maxLength={500}
									rows={3}
									className="mb-3 w-full resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
									style={{
										fontFamily: "var(--font-body)",
										fontSize: "0.9375rem",
										fontWeight: 500,
										color: "var(--color-text-primary)",
										lineHeight: 1.5,
										background: "var(--color-bg-sunken)",
										border: "1px solid var(--color-accent-blue)",
									}}
								/>
							) : (
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
									{displayStatement}
								</p>
							)}

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
								{mode === "editing" ? (
									<input
										type="text"
										value={editedThemeTag}
										onChange={(e) => setEditedThemeTag(e.target.value)}
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
								)}

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

							{/* Error */}
							{submitError && (
								<p
									className="mb-3 text-xs"
									style={{
										color: "var(--color-status-error)",
										fontFamily: "var(--font-body)",
									}}
								>
									{submitError}
								</p>
							)}

							{/* Actions row — hidden when accepted */}
							{!isAccepted && (
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										{mode === "accepting" ? (
											<div className="flex items-center gap-2 px-1 py-1.5">
												<Loader2
													size={14}
													className="animate-spin"
													style={{ color: "var(--color-status-success)" }}
												/>
												<span
													style={{
														fontFamily: "var(--font-body)",
														fontSize: "0.8125rem",
														color: "var(--color-text-muted)",
													}}
												>
													Creating insight…
												</span>
											</div>
										) : mode === "editing" ? (
											<>
												<button
													type="button"
													onClick={() => doAccept(editedStatement, editedThemeTag)}
													disabled={!editedStatement.trim()}
													className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-status-success]"
													style={{
														fontFamily: "var(--font-body)",
														background: "var(--color-status-success)",
														color: "var(--color-text-inverse)",
													}}
												>
													<CheckCircle size={12} strokeWidth={2.5} />
													Save & Accept
												</button>
												<button
													type="button"
													onClick={() => {
														setEditedStatement(suggestion.statement);
														setEditedThemeTag(suggestion.suggestedThemeTag);
														setMode("viewing");
													}}
													className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
													style={{
														fontFamily: "var(--font-body)",
														color: "var(--color-text-muted)",
														border: "1px solid var(--color-border-subtle)",
													}}
												>
													Cancel
												</button>
											</>
										) : (
											<>
												<button
													type="button"
													onClick={() =>
														doAccept(suggestion.statement, suggestion.suggestedThemeTag)
													}
													className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-status-success]"
													style={{
														fontFamily: "var(--font-body)",
														background: "var(--color-status-success)",
														color: "var(--color-text-inverse)",
														height: "32px",
													}}
												>
													<CheckCircle size={12} strokeWidth={2.5} />
													Accept
												</button>
												<button
													type="button"
													onClick={() => setMode("editing")}
													className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
													style={{
														fontFamily: "var(--font-body)",
														color: "var(--color-text-muted)",
														border: "1px solid var(--color-border-default)",
													}}
												>
													<Edit2 size={11} strokeWidth={2} />
													Edit
												</button>
												<button
													type="button"
													onClick={handleDismiss}
													className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none"
													style={{
														fontFamily: "var(--font-body)",
														color: "var(--color-text-muted)",
													}}
												>
													<X size={11} strokeWidth={2} />
													Dismiss
												</button>
											</>
										)}
									</div>

									{/* AI attribution */}
									<div
										className="flex items-center gap-1"
										style={{ color: "var(--color-text-muted)" }}
									>
										<Sparkles size={12} style={{ color: "var(--color-accent-blue)" }} />
										<span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem" }}>
											AI suggestion
										</span>
									</div>
								</div>
							)}

							{/* Accepted attribution */}
							{isAccepted && (
								<p
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "0.65rem",
										color: "var(--color-text-muted)",
									}}
								>
									AI · Accepted
								</p>
							)}
						</div>

						{/* ── Inline Problem Linker — slides in below card content ── */}
						<AnimatePresence>
							{mode === "linking" && createdInsightId && (
								<InlineProblemLinker
									key="linker"
									projectId={projectId}
									workspaceId={workspaceId}
									insightId={createdInsightId}
									onLinked={handleLinked}
									onSkipped={handleSkipped}
									onNewProblemCreated={handleNewProblemCreated}
								/>
							)}
						</AnimatePresence>
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
							Suggestion dismissed
						</span>
						<button
							type="button"
							onClick={handleUndo}
							className="rounded-md px-2.5 py-1 text-xs font-semibold transition-colors duration-150 hover:bg-white/10 focus-visible:outline-none"
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
