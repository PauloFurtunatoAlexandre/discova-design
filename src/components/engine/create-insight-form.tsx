"use client";

import { createManualInsightAction } from "@/actions/insights";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { QuoteSearch } from "./quote-search";

interface ProblemSearchResult {
	id: string;
	label: string;
}

interface CreateInsightFormProps {
	workspaceId: string;
	projectId: string;
	onCreated: (insightId: string) => void;
	onClose: () => void;
}

// ─── Simple problem selector (subset of InlineProblemLinker) ─────────────────

function ProblemSelect({
	projectId,
	workspaceId,
	value,
	onChange,
}: {
	projectId: string;
	workspaceId: string;
	value: string | null;
	onChange: (id: string | null, label: string | null) => void;
}) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<ProblemSearchResult[]>([]);
	const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			const params = new URLSearchParams({ projectId });
			if (query) params.set("q", query);
			const res = await fetch(`/api/map/problems?${params.toString()}`);
			if (res.ok) {
				const data = (await res.json()) as ProblemSearchResult[];
				setResults(data);
			}
		}, 200);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, projectId]);

	if (value && selectedLabel) {
		return (
			<div className="flex items-center gap-2">
				<span
					className="rounded-full px-2.5 py-1"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.8125rem",
						color: "var(--color-accent-coral)",
						background: "color-mix(in srgb, var(--color-accent-coral) 10%, transparent)",
					}}
				>
					→ {selectedLabel}
				</span>
				<button
					type="button"
					onClick={() => {
						onChange(null, null);
						setSelectedLabel(null);
						setQuery("");
					}}
					className="rounded-md p-0.5 focus-visible:outline-none"
					style={{ color: "var(--color-text-muted)" }}
					aria-label="Remove problem link"
				>
					<X size={12} />
				</button>
			</div>
		);
	}

	return (
		<div>
			<input
				type="text"
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search existing problems..."
				className="mb-2 h-9 w-full rounded-md bg-[--color-bg-sunken] px-3 text-sm outline-none focus:ring-1 focus:ring-[--color-accent-coral]"
				style={{
					fontFamily: "var(--font-body)",
					border: "1px solid var(--color-border-subtle)",
					color: "var(--color-text-primary)",
				}}
			/>
			{results.length > 0 && (
				<div className="max-h-[120px] overflow-y-auto rounded-md border border-[--color-border-subtle]">
					{results.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => {
								onChange(p.id, p.label);
								setSelectedLabel(p.label);
							}}
							className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-white/5 focus-visible:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								color: "var(--color-text-primary)",
							}}
						>
							{p.label}
						</button>
					))}
				</div>
			)}
			<p
				className="mt-2"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.75rem",
					fontStyle: "italic",
					color: "var(--color-text-muted)",
				}}
			>
				Connect to a problem later — you can always link from the Map view.
			</p>
		</div>
	);
}

// ─── Main Form ────────────────────────────────────────────────────────────────

export function CreateInsightForm({
	workspaceId,
	projectId,
	onCreated,
	onClose,
}: CreateInsightFormProps) {
	const prefersReducedMotion = useReducedMotion();

	const [statement, setStatement] = useState("");
	const [themeTag, setThemeTag] = useState("");
	const [selectedQuoteIds, setSelectedQuoteIds] = useState<string[]>([]);
	const [problemNodeId, setProblemNodeId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Close on Escape
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!statement.trim()) return;

		setIsSubmitting(true);
		setError(null);

		const result = await createManualInsightAction({
			workspaceId,
			projectId,
			statement: statement.trim(),
			themeTag: themeTag.trim() || null,
			evidenceQuoteIds: selectedQuoteIds,
			problemNodeId,
		});

		setIsSubmitting(false);

		if ("error" in result) {
			setError(result.error);
			return;
		}

		onCreated(result.insightId);
	}

	const charCount = statement.length;
	const maxChars = 500;
	const canSubmit = statement.trim().length > 0 && !isSubmitting;

	return (
		<AnimatePresence>
			{/* Backdrop */}
			<motion.div
				key="backdrop"
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
				className="fixed inset-0 z-40"
				style={{ background: "rgba(0,0,0,0.4)" }}
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Slide-over panel */}
			<motion.dialog
				key="panel"
				open
				aria-modal="true"
				aria-label="Create Insight"
				initial={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
				animate={prefersReducedMotion ? { opacity: 1 } : { x: 0 }}
				exit={prefersReducedMotion ? { opacity: 0 } : { x: "100%" }}
				transition={
					prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }
				}
				className="fixed right-0 top-0 z-50 flex h-full w-full flex-col sm:w-[480px]"
				style={{
					background: "var(--color-bg-surface)",
					borderLeft: "1px solid var(--color-border-subtle)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				{/* Header */}
				<div
					className="flex shrink-0 items-center justify-between p-5"
					style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
				>
					<h2
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: "1.25rem",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						Create Insight
					</h2>
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="rounded-md p-1.5 transition-colors hover:bg-white/5 focus-visible:outline-none"
						style={{ color: "var(--color-text-muted)" }}
					>
						<X size={18} />
					</button>
				</div>

				{/* Scrollable form body */}
				<form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-y-auto">
					<div className="flex flex-col gap-6 p-5">
						{/* Statement */}
						<div>
							<label
								htmlFor="insight-statement"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.65rem",
									color: "var(--color-text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									display: "block",
									marginBottom: "8px",
								}}
							>
								Insight Statement *
							</label>
							<textarea
								id="insight-statement"
								value={statement}
								onChange={(e) => setStatement(e.target.value)}
								rows={3}
								maxLength={maxChars}
								placeholder="One clear declarative sentence..."
								required
								className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
								style={{
									fontFamily: "var(--font-body)",
									color: "var(--color-text-primary)",
									background: "var(--color-bg-sunken)",
									border: "1px solid var(--color-border-subtle)",
									lineHeight: 1.6,
								}}
							/>
							<div className="mt-1 flex items-start justify-between gap-2">
								<p
									style={{
										fontFamily: "var(--font-body)",
										fontSize: "0.75rem",
										fontStyle: "italic",
										color: "var(--color-text-muted)",
									}}
								>
									Write a single observation supported by evidence. e.g., &ldquo;Users abandon
									checkout when forced to create an account.&rdquo;
								</p>
								<span
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "0.65rem",
										color:
											charCount > maxChars * 0.9
												? "var(--color-status-warning)"
												: "var(--color-text-muted)",
										whiteSpace: "nowrap",
									}}
								>
									{charCount}/{maxChars}
								</span>
							</div>
						</div>

						{/* Theme tag */}
						<div>
							<label
								htmlFor="theme-tag"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.65rem",
									color: "var(--color-text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									display: "block",
									marginBottom: "8px",
								}}
							>
								Theme Tag
							</label>
							<input
								id="theme-tag"
								type="text"
								value={themeTag}
								onChange={(e) => setThemeTag(e.target.value)}
								maxLength={50}
								placeholder="e.g., onboarding, retention, pricing"
								className="h-9 w-full rounded-md px-3 text-sm outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
								style={{
									fontFamily: "var(--font-mono)",
									color: "var(--color-text-primary)",
									background: "var(--color-bg-sunken)",
									border: "1px solid var(--color-border-subtle)",
								}}
							/>
						</div>

						{/* Evidence */}
						<div>
							<p
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.65rem",
									color: "var(--color-text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									marginBottom: "8px",
								}}
							>
								Linked Evidence{" "}
								{selectedQuoteIds.length > 0 && (
									<span
										style={{
											color: "var(--color-accent-gold)",
											textTransform: "none",
										}}
									>
										({selectedQuoteIds.length} selected)
									</span>
								)}
							</p>
							<QuoteSearch
								projectId={projectId}
								workspaceId={workspaceId}
								selectedQuoteIds={selectedQuoteIds}
								onSelectionChange={setSelectedQuoteIds}
							/>
							<p
								className="mt-2"
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.75rem",
									fontStyle: "italic",
									color: "var(--color-text-muted)",
								}}
							>
								Link quotes from your research notes to build confidence.
							</p>
						</div>

						{/* Problem link */}
						<div>
							<p
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.65rem",
									color: "var(--color-text-muted)",
									textTransform: "uppercase",
									letterSpacing: "0.08em",
									marginBottom: "8px",
								}}
							>
								Related Problem
							</p>
							<ProblemSelect
								projectId={projectId}
								workspaceId={workspaceId}
								value={problemNodeId}
								onChange={(id, _label) => setProblemNodeId(id)}
							/>
						</div>
					</div>

					{/* Pinned footer */}
					<div
						className="shrink-0 p-5"
						style={{ borderTop: "1px solid var(--color-border-subtle)" }}
					>
						{error && (
							<p
								className="mb-3 text-xs"
								style={{
									color: "var(--color-status-error)",
									fontFamily: "var(--font-body)",
								}}
							>
								{error}
							</p>
						)}
						<button
							type="submit"
							disabled={!canSubmit}
							className="w-full rounded-lg py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-blue]"
							style={{
								fontFamily: "var(--font-body)",
								background: "var(--color-accent-blue)",
								color: "#fff",
							}}
						>
							{isSubmitting ? "Creating…" : "Create Insight"}
						</button>
					</div>
				</form>
			</motion.dialog>
		</AnimatePresence>
	);
}
