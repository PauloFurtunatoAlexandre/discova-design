"use client";

import { linkInsightToProblemAction } from "@/actions/insights";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CreateProblemInline } from "./create-problem-inline";
import { ProblemSearchItem } from "./problem-search-item";

interface Problem {
	id: string;
	label: string;
	description: string | null;
	connectedInsightCount: number;
}

interface InlineProblemLinkerProps {
	projectId: string;
	workspaceId: string;
	insightId: string;
	onLinked: (problemNodeId: string, problemLabel: string) => void;
	onSkipped: () => void;
	onNewProblemCreated: (problemNodeId: string, problemLabel: string) => void;
}

export function InlineProblemLinker({
	projectId,
	workspaceId,
	insightId,
	onLinked,
	onSkipped,
	onNewProblemCreated,
}: InlineProblemLinkerProps) {
	const prefersReducedMotion = useReducedMotion();
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Problem[]>([]);
	const [isSearching, setIsSearching] = useState(true);
	const [isLinking, setIsLinking] = useState(false);
	const [showCreateForm, setShowCreateForm] = useState(false);
	const [linkError, setLinkError] = useState<string | null>(null);
	const searchRef = useRef<HTMLInputElement>(null);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Auto-focus search on mount
	useEffect(() => {
		const t = setTimeout(() => searchRef.current?.focus(), 80);
		return () => clearTimeout(t);
	}, []);

	// Debounced problem search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const params = new URLSearchParams({ projectId });
				if (query) params.set("q", query);
				const res = await fetch(`/api/map/problems?${params.toString()}`);
				if (res.ok) {
					const data = (await res.json()) as Problem[];
					setResults(data);
				}
			} finally {
				setIsSearching(false);
			}
		}, 200);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, projectId]);

	async function handleSelectProblem(problem: Problem) {
		setIsLinking(true);
		setLinkError(null);
		const result = await linkInsightToProblemAction({
			workspaceId,
			projectId,
			insightId,
			problemNodeId: problem.id,
		});
		setIsLinking(false);
		if ("error" in result) {
			setLinkError(result.error);
			return;
		}
		onLinked(problem.id, problem.label);
	}

	return (
		<motion.div
			initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
			transition={
				prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 25 }
			}
			style={{
				background: "var(--color-bg-surface)",
				borderTop: "1px solid var(--color-border-subtle)",
				padding: "16px 20px",
			}}
		>
			<p
				className="mb-3"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.875rem",
					fontWeight: 500,
					color: "var(--color-text-primary)",
				}}
			>
				Which problem does this relate to?
			</p>

			{/* Search input */}
			<div
				className="relative mb-3 flex items-center"
				style={{
					border: "1px solid var(--color-border-subtle)",
					borderRadius: "var(--radius-md)",
					background: "var(--color-bg-sunken)",
					height: "36px",
				}}
			>
				<Search
					size={13}
					className="pointer-events-none absolute left-3"
					style={{ color: "var(--color-text-muted)" }}
				/>
				<input
					ref={searchRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search existing problems..."
					className="h-full w-full bg-transparent pl-8 pr-3 text-sm outline-none"
					style={{
						fontFamily: "var(--font-body)",
						color: "var(--color-text-primary)",
					}}
					disabled={isLinking}
				/>
			</div>

			{/* Results list */}
			<div className="mb-3 max-h-[200px] overflow-y-auto">
				{isSearching ? (
					<p
						className="px-3 py-2 text-xs"
						style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
					>
						Searching…
					</p>
				) : results.length === 0 ? (
					<p
						className="px-3 py-2 text-sm"
						style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
					>
						{query ? "No problems found." : "No problems in this project yet."}
					</p>
				) : (
					results.map((p) => (
						<ProblemSearchItem
							key={p.id}
							label={p.label}
							description={p.description}
							connectedInsightCount={p.connectedInsightCount}
							onClick={() => handleSelectProblem(p)}
						/>
					))
				)}
			</div>

			{linkError && (
				<p
					className="mb-2 text-xs"
					style={{ color: "var(--color-status-error)", fontFamily: "var(--font-body)" }}
				>
					{linkError}
				</p>
			)}

			{/* Divider */}
			<div style={{ borderTop: "1px solid var(--color-border-subtle)", marginBottom: "12px" }} />

			{/* Footer: create new + skip */}
			<div className="flex flex-col gap-2">
				<AnimatePresence mode="wait">
					{showCreateForm ? (
						<motion.div
							key="create-form"
							initial={prefersReducedMotion ? {} : { opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={prefersReducedMotion ? {} : { opacity: 0, y: -6 }}
							transition={
								prefersReducedMotion
									? { duration: 0 }
									: { type: "spring", stiffness: 300, damping: 28 }
							}
						>
							<CreateProblemInline
								projectId={projectId}
								workspaceId={workspaceId}
								insightId={insightId}
								onCreated={(problemNodeId, problemLabel) =>
									onNewProblemCreated(problemNodeId, problemLabel)
								}
								onCancel={() => setShowCreateForm(false)}
							/>
						</motion.div>
					) : (
						<motion.button
							key="create-btn"
							type="button"
							onClick={() => setShowCreateForm(true)}
							initial={prefersReducedMotion ? {} : { opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={prefersReducedMotion ? {} : { opacity: 0 }}
							className="text-left text-sm font-medium transition-colors duration-150 hover:underline focus-visible:outline-none"
							style={{ color: "var(--color-accent-coral)", fontFamily: "var(--font-body)" }}
							disabled={isLinking}
						>
							+ Create new problem
						</motion.button>
					)}
				</AnimatePresence>

				<button
					type="button"
					onClick={onSkipped}
					className="text-left transition-colors duration-150 hover:underline focus-visible:outline-none disabled:opacity-50"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
					}}
					disabled={isLinking}
				>
					Skip — I'll connect later
				</button>
			</div>
		</motion.div>
	);
}
