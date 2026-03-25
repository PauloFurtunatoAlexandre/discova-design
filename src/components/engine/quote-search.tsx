"use client";

import type { QuoteSearchResult } from "@/app/api/vault/quotes/route";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface QuoteSearchProps {
	projectId: string;
	workspaceId: string;
	selectedQuoteIds: string[];
	onSelectionChange: (quoteIds: string[]) => void;
}

function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text;
	return `${text.slice(0, maxLen)}…`;
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

export function QuoteSearch({
	projectId,
	workspaceId,
	selectedQuoteIds,
	onSelectionChange,
}: QuoteSearchProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<QuoteSearchResult[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [selectedQuotes, setSelectedQuotes] = useState<QuoteSearchResult[]>([]);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Debounced search
	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(async () => {
			setIsSearching(true);
			try {
				const params = new URLSearchParams({ projectId, workspaceId });
				if (query) params.set("q", query);
				const res = await fetch(`/api/vault/quotes?${params.toString()}`);
				if (res.ok) {
					const data = (await res.json()) as QuoteSearchResult[];
					setResults(data);
				}
			} finally {
				setIsSearching(false);
			}
		}, 300);
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [query, projectId, workspaceId]);

	function toggle(quote: QuoteSearchResult) {
		if (selectedQuoteIds.includes(quote.id)) {
			// Deselect
			const newIds = selectedQuoteIds.filter((id) => id !== quote.id);
			setSelectedQuotes((prev) => prev.filter((q) => q.id !== quote.id));
			onSelectionChange(newIds);
		} else {
			// Select
			const newIds = [...selectedQuoteIds, quote.id];
			setSelectedQuotes((prev) => [...prev, quote]);
			onSelectionChange(newIds);
		}
	}

	function deselect(quoteId: string) {
		const newIds = selectedQuoteIds.filter((id) => id !== quoteId);
		setSelectedQuotes((prev) => prev.filter((q) => q.id !== quoteId));
		onSelectionChange(newIds);
	}

	return (
		<div>
			{/* Selected quote pills */}
			{selectedQuotes.length > 0 && (
				<div className="mb-3 flex flex-wrap gap-2">
					{selectedQuotes.map((q) => (
						<span
							key={q.id}
							className="flex items-center gap-1.5 rounded-full px-2.5 py-1"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.75rem",
								fontStyle: "italic",
								background: "color-mix(in srgb, var(--color-accent-gold) 14%, transparent)",
								color: "var(--color-accent-gold)",
							}}
						>
							{truncate(q.text, 40)}
							<button
								type="button"
								aria-label={`Remove quote: ${q.text}`}
								onClick={() => deselect(q.id)}
								className="focus-visible:outline-none"
								style={{ color: "inherit", opacity: 0.7 }}
							>
								<X size={11} />
							</button>
						</span>
					))}
				</div>
			)}

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
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					placeholder="Search quotes across all notes..."
					className="h-full w-full bg-transparent pl-8 pr-3 text-sm outline-none"
					style={{
						fontFamily: "var(--font-body)",
						color: "var(--color-text-primary)",
					}}
				/>
			</div>

			{/* Results */}
			<div className="max-h-[200px] overflow-y-auto">
				{isSearching ? (
					<p
						className="px-1 py-2 text-xs"
						style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
					>
						Searching…
					</p>
				) : results.length === 0 ? (
					<p
						className="px-1 py-2 text-sm"
						style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
					>
						{query ? "No quotes found." : "No quotes in this project yet."}
					</p>
				) : (
					results.map((q) => {
						const isSelected = selectedQuoteIds.includes(q.id);
						return (
							<button
								key={q.id}
								type="button"
								onClick={() => toggle(q)}
								className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-100 hover:bg-white/5 focus-visible:outline-none"
							>
								{/* Checkbox */}
								<span
									className="mt-0.5 shrink-0 rounded"
									style={{
										width: 14,
										height: 14,
										border: isSelected
											? "2px solid var(--color-accent-gold)"
											: "2px solid var(--color-border-default)",
										background: isSelected ? "var(--color-accent-gold)" : "transparent",
									}}
									aria-hidden="true"
								/>

								<div className="flex-1 min-w-0">
									{/* Quote text */}
									<p
										style={{
											fontFamily: "var(--font-body)",
											fontSize: "0.8125rem",
											fontStyle: "italic",
											color: "var(--color-text-secondary)",
											lineHeight: 1.4,
										}}
									>
										{truncate(q.text, 100)}
									</p>
									{/* Source */}
									<p
										className="mt-0.5"
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: "0.65rem",
											color: "var(--color-text-muted)",
										}}
									>
										{q.participantName} · {formatDate(q.sessionDate)}
									</p>
								</div>
							</button>
						);
					})
				)}
			</div>
		</div>
	);
}
