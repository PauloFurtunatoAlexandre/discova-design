"use client";

import type { NoteQuote } from "@/lib/queries/vault";

interface QuotesListProps {
	quotes: NoteQuote[];
	onQuoteClick?: (startOffset: number) => void;
}

export function QuotesList({ quotes, onQuoteClick }: QuotesListProps) {
	const labelStyle: React.CSSProperties = {
		fontFamily: "var(--font-mono)",
		fontSize: "0.7rem",
		color: "var(--color-text-muted)",
		textTransform: "uppercase" as const,
		letterSpacing: "0.08em",
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<p style={labelStyle}>Quotes</p>
				{quotes.length > 0 && (
					<span
						className="rounded-full px-1.5 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							color: "var(--color-accent-gold)",
							background: "var(--color-accent-gold-muted)",
							border: "1px solid var(--color-accent-gold-border)",
						}}
					>
						{quotes.length}
					</span>
				)}
			</div>

			{quotes.length === 0 ? (
				<p
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
						fontStyle: "italic",
						lineHeight: 1.5,
					}}
				>
					No quotes extracted yet. Highlight text in the editor to extract quotes.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{quotes.map((quote) => (
						<li key={quote.id}>
							<button
								type="button"
								onClick={() => onQuoteClick?.(quote.startOffset)}
								className="w-full rounded-lg p-2.5 text-left transition-colors duration-100 hover:bg-white/5 focus:outline-none"
								style={{ border: "1px solid var(--color-border-subtle)" }}
							>
								<p
									style={{
										fontFamily: "var(--font-body)",
										fontSize: "0.8rem",
										color: "var(--color-text-secondary)",
										fontStyle: "italic",
										lineHeight: 1.5,
									}}
								>
									"{quote.text.length > 60 ? `${quote.text.slice(0, 60)}...` : quote.text}"
								</p>
								{quote.linkedInsightCount > 0 && (
									<p
										className="mt-1"
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: "0.65rem",
											color: "var(--color-text-muted)",
										}}
									>
										{quote.linkedInsightCount}{" "}
										{quote.linkedInsightCount === 1 ? "insight" : "insights"}
									</p>
								)}
								{quote.isStale && (
									<p
										className="mt-1"
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: "0.65rem",
											color: "var(--color-status-warning)",
										}}
									>
										Stale
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
