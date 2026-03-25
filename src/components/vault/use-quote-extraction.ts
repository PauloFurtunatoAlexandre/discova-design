"use client";

import { selectionToOffsets } from "@/lib/vault/quote-offsets";
import type { Editor } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TooltipState {
	visible: boolean;
	position: { x: number; y: number };
	selectedText: string;
	startOffset: number;
	endOffset: number;
}

const INITIAL_STATE: TooltipState = {
	visible: false,
	position: { x: 0, y: 0 },
	selectedText: "",
	startOffset: 0,
	endOffset: 0,
};

/**
 * Detects text selection inside the Tiptap editor and manages the floating
 * "Extract as Quote" tooltip. Handles mouse, keyboard, and touch selection.
 */
export function useQuoteExtraction({
	editor,
	canEdit,
	containerRef,
}: {
	editor: Editor | null;
	canEdit: boolean;
	containerRef: React.RefObject<HTMLDivElement | null>;
}) {
	const [state, setState] = useState<TooltipState>(INITIAL_STATE);
	// Prevent clearance when tooltip mousedown fires before mouseup
	const tooltipClickRef = useRef(false);

	const checkSelection = useCallback(() => {
		if (!editor || !canEdit) return;

		const { empty } = editor.state.selection;
		if (empty) {
			setState(INITIAL_STATE);
			return;
		}

		const offsets = selectionToOffsets(editor);
		if (!offsets) {
			setState(INITIAL_STATE);
			return;
		}

		// Get bounding rect from the DOM selection
		const domSelection = window.getSelection();
		if (!domSelection || domSelection.rangeCount === 0) return;

		const range = domSelection.getRangeAt(0);
		const rect = range.getBoundingClientRect();
		if (rect.width === 0 && rect.height === 0) return;

		// Center horizontally over the selection, position above it
		const x = rect.left + rect.width / 2;
		const y = rect.top;

		setState({
			visible: true,
			position: { x, y },
			selectedText: offsets.text,
			startOffset: offsets.startOffset,
			endOffset: offsets.endOffset,
		});
	}, [editor, canEdit]);

	const clearSelection = useCallback(() => {
		setState(INITIAL_STATE);
		if (editor) {
			// Move cursor to end of selection to deselect
			const { to } = editor.state.selection;
			editor.commands.setTextSelection(to);
		}
	}, [editor]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !canEdit) return;

		function handleMouseUp(e: MouseEvent) {
			// Ignore clicks on the tooltip itself
			const target = e.target as Element;
			if (target.closest("[data-quote-tooltip]")) return;
			// Small delay to let ProseMirror process the selection update
			setTimeout(checkSelection, 10);
		}

		function handleKeyUp(e: KeyboardEvent) {
			if (e.key === "Escape") {
				setState(INITIAL_STATE);
				return;
			}
			// Re-check after navigation/selection keys
			if (
				["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(e.key) ||
				e.shiftKey
			) {
				setTimeout(checkSelection, 10);
			}
		}

		function handleTouchEnd() {
			// Touch selections need more time to settle
			setTimeout(checkSelection, 100);
		}

		container.addEventListener("mouseup", handleMouseUp);
		container.addEventListener("keyup", handleKeyUp);
		container.addEventListener("touchend", handleTouchEnd);

		return () => {
			container.removeEventListener("mouseup", handleMouseUp);
			container.removeEventListener("keyup", handleKeyUp);
			container.removeEventListener("touchend", handleTouchEnd);
		};
	}, [canEdit, checkSelection, containerRef]);

	// Hide tooltip on click outside the editor (but not on the tooltip itself)
	useEffect(() => {
		if (!state.visible) return;

		function handleDocMouseDown(e: MouseEvent) {
			if (tooltipClickRef.current) {
				tooltipClickRef.current = false;
				return;
			}
			const target = e.target as Element;
			if (target.closest("[data-quote-tooltip]")) {
				tooltipClickRef.current = true;
				return;
			}
			setState(INITIAL_STATE);
		}

		document.addEventListener("mousedown", handleDocMouseDown);
		return () => document.removeEventListener("mousedown", handleDocMouseDown);
	}, [state.visible]);

	return {
		showTooltip: state.visible,
		tooltipPosition: state.position,
		selectedText: state.selectedText,
		selectedOffsets: { startOffset: state.startOffset, endOffset: state.endOffset },
		clearSelection,
	};
}
