import type { Editor } from "@tiptap/react";

/**
 * Convert the current Tiptap selection to stored quote offsets.
 *
 * We store raw ProseMirror positions as startOffset/endOffset. This provides a
 * direct, lossless mapping that works reliably with Tiptap's internal model.
 * The positions are absolute positions within the ProseMirror document.
 */
export function selectionToOffsets(editor: Editor): {
	text: string;
	startOffset: number;
	endOffset: number;
} | null {
	const { from, to, empty } = editor.state.selection;
	if (empty) return null;

	const text = editor.state.doc.textBetween(from, to, "\n");
	if (!text.trim()) return null;

	return { text, startOffset: from, endOffset: to };
}

/**
 * Get the plain text at a stored offset range.
 * Used for staleness detection: if the text no longer matches the stored quote
 * text, the quote should be marked stale.
 */
export function getPlainTextAtRange(
	editor: Editor,
	startOffset: number,
	endOffset: number,
): string {
	try {
		const docSize = editor.state.doc.content.size;
		if (startOffset < 0 || endOffset > docSize + 1 || startOffset >= endOffset) {
			return "";
		}
		return editor.state.doc.textBetween(startOffset, endOffset, "\n");
	} catch {
		return "";
	}
}

/**
 * Check if a content change range overlaps with a quote's offset range.
 * Used to detect when edits within a quote's range invalidate it.
 */
export function doesChangeOverlapQuote(
	changeStart: number,
	changeEnd: number,
	quoteStart: number,
	quoteEnd: number,
): boolean {
	return changeStart < quoteEnd && changeEnd > quoteStart;
}
