"use client";

import type { NoteQuote } from "@/lib/queries/vault";
import { useCallback, useState } from "react";

interface QuotesListProps {
	quotes: NoteQuote[];
	onQuoteClick?: (startOffset: number) => void;
}

export function QuotesList({ quotes, onQuoteClick }: QuotesListProps) {
	const [flashingId, setFlashingId] = useState<string | null>(null);

	const handleClick = useCallback(
		(quote: NoteQuote) => {
			onQuoteClick?.(quote.startOffset);
			setFlashingId(quote.id);
			setTimeout(() => setFlashingId(null), 500);
		},
		[onQuoteClick],
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<p className="meta-label" style={{ marginBottom: 0 }}>
					Quotes
				</p>
				{quotes.length > 0 && (
					<span className="rounded-full border border-[--color-accent-gold-border] bg-[--color-accent-gold-muted] px-1.5 py-0.5 font-mono text-[0.65rem] text-[--color-accent-gold]">
						{quotes.length}
					</span>
				)}
			</div>

			{quotes.length === 0 ? (
				<p className="font-body text-[0.75rem] italic leading-normal text-[--color-text-muted]">
					No quotes extracted yet. Highlight text in the editor to extract quotes.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{quotes.map((quote) => (
						<li key={quote.id}>
							<button
								type="button"
								onClick={() => handleClick(quote)}
								className="w-full rounded-lg p-2.5 text-left transition-all duration-150 hover:bg-white/5 focus:outline-none"
								style={{
									border: `1px solid ${quote.isStale ? "var(--color-status-warning)" : "var(--color-border-subtle)"}`,
									opacity: flashingId === quote.id ? 0.35 : 1,
								}}
							>
								<p className="font-body text-[0.8rem] italic leading-normal text-[--color-text-secondary]">
									"{quote.text.length > 60 ? `${quote.text.slice(0, 60)}...` : quote.text}"
								</p>
								{quote.linkedInsightCount > 0 && (
									<p className="mt-1 font-mono text-[0.65rem] text-[--color-accent-blue]">
										{quote.linkedInsightCount}{" "}
										{quote.linkedInsightCount === 1 ? "insight" : "insights"}
									</p>
								)}
								{quote.isStale && (
									<p className="mt-1 font-mono text-[0.65rem] text-[--color-status-warning]">
										⚠ May be stale
									</p>
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
