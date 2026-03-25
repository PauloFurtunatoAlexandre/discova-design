"use client";

import type { NoteQuote } from "@/lib/queries/vault";
import type { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";

interface ClickedQuote {
	quote: NoteQuote;
	position: { x: number; y: number };
}

/**
 * Manages quote highlights in the Tiptap editor.
 *
 * On mount and whenever quotes change, applies Highlight marks at stored
 * ProseMirror positions. Uses a custom transaction meta flag ("quoteHighlight")
 * to prevent the highlight application from triggering a content save.
 *
 * Also handles click detection on highlighted text to show the quote popover.
 */
export function useQuoteHighlights({
	editor,
	quotes,
	containerRef,
}: {
	editor: Editor | null;
	quotes: NoteQuote[];
	containerRef: React.RefObject<HTMLDivElement | null>;
}) {
	const [clickedQuote, setClickedQuote] = useState<ClickedQuote | null>(null);
	const isApplyingRef = useRef(false);
	const quotesRef = useRef(quotes);
	quotesRef.current = quotes;

	// Apply highlights whenever the editor or quotes list changes
	useEffect(() => {
		if (!editor || editor.isDestroyed || isApplyingRef.current) return;

		const { state } = editor;
		const highlightType = state.schema.marks.highlight;
		if (!highlightType) return;

		isApplyingRef.current = true;
		try {
			const { tr } = state;
			const docSize = state.doc.content.size;

			// Remove all existing highlight marks
			tr.removeMark(0, docSize, highlightType);

			// Re-apply highlights for each quote at its stored range
			for (const quote of quotes) {
				const from = quote.startOffset;
				const to = quote.endOffset;

				if (from < 0 || to > docSize || from >= to) continue;

				const attrs = quote.isStale ? { color: "stale" } : { color: null };
				tr.addMark(from, to, highlightType.create(attrs));
			}

			// Mark as quote-highlight so onUpdate skips content saving
			tr.setMeta("quoteHighlight", true);
			tr.setMeta("addToHistory", false);

			editor.view.dispatch(tr);
		} finally {
			isApplyingRef.current = false;
		}
	}, [editor, quotes]);

	// Detect clicks on highlighted text to show the quote popover
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !editor) return;

		function handleClick(e: MouseEvent) {
			// Only trigger if clicking on a highlighted mark element
			const target = e.target as Element;
			const markEl = target.closest("mark.quote-highlight");
			if (!markEl) return;

			const coords = editor?.view.posAtCoords({ left: e.clientX, top: e.clientY });
			if (!coords) return;

			const clickedPos = coords.pos;
			const currentQuotes = quotesRef.current;
			const found = currentQuotes.find(
				(q) => clickedPos >= q.startOffset && clickedPos < q.endOffset,
			);

			if (found) {
				e.preventDefault();
				e.stopPropagation();
				setClickedQuote({ quote: found, position: { x: e.clientX, y: e.clientY } });
			}
		}

		container.addEventListener("click", handleClick);
		return () => container.removeEventListener("click", handleClick);
	}, [editor, containerRef]);

	// Close popover on Escape or click outside
	useEffect(() => {
		if (!clickedQuote) return;

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") setClickedQuote(null);
		}

		function handleMouseDown(e: MouseEvent) {
			const target = e.target as Element;
			if (!target.closest("[data-quote-popover]")) {
				setClickedQuote(null);
			}
		}

		document.addEventListener("keydown", handleKeyDown);
		document.addEventListener("mousedown", handleMouseDown);
		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [clickedQuote]);

	return {
		clickedQuote,
		clearClickedQuote: () => setClickedQuote(null),
	};
}
