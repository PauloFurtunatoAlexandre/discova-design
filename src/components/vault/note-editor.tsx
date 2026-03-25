"use client";

import type { NoteQuote } from "@/lib/queries/vault";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef } from "react";
import { NoteEditorToolbar } from "./note-editor-toolbar";
import { QuoteExtractionTooltip } from "./quote-extraction-tooltip";
import { QuoteHighlightPopover } from "./quote-highlight-popover";
import { useQuoteExtraction } from "./use-quote-extraction";
import { useQuoteHighlights } from "./use-quote-highlights";

function parseContent(rawContent: string): Record<string, unknown> | string {
	if (!rawContent) {
		return { type: "doc", content: [{ type: "paragraph", content: [] }] };
	}
	try {
		return JSON.parse(rawContent) as Record<string, unknown>;
	} catch {
		// Plain text from wizard — wrap in a Tiptap doc
		return {
			type: "doc",
			content: [
				{
					type: "paragraph",
					content: [{ type: "text", text: rawContent }],
				},
			],
		};
	}
}

/**
 * Strip highlight marks from the Tiptap JSON before saving to the database.
 * Highlights are managed as visual overlays via useQuoteHighlights — they must
 * not be persisted in the raw note content.
 */
function stripHighlightMarks(content: Record<string, unknown>): Record<string, unknown> {
	return JSON.parse(
		JSON.stringify(content, (_key, value) => {
			if (_key === "marks" && Array.isArray(value)) {
				const filtered = (value as Array<{ type: string }>).filter((m) => m.type !== "highlight");
				return filtered.length > 0 ? filtered : undefined;
			}
			return value;
		}),
	) as Record<string, unknown>;
}

interface NoteEditorProps {
	initialContent: string;
	canEdit: boolean;
	noteId: string;
	workspaceId: string;
	projectId: string;
	quotes: NoteQuote[];
	onContentChange: (content: string) => void;
	onEditorReady?: (editor: Editor) => void;
	onExtractQuote: (offsets: {
		text: string;
		startOffset: number;
		endOffset: number;
	}) => Promise<void>;
	onDeleteQuote: (quoteId: string, force: boolean) => Promise<void>;
}

export function NoteEditor({
	initialContent,
	canEdit,
	workspaceId,
	projectId,
	quotes,
	onContentChange,
	onEditorReady,
	onExtractQuote,
	onDeleteQuote,
}: NoteEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	const editor = useEditor({
		extensions: [
			StarterKit.configure({
				heading: { levels: [1, 2, 3] },
			}),
			Highlight.configure({
				multicolor: true,
				HTMLAttributes: { class: "quote-highlight" },
			}),
			Placeholder.configure({
				placeholder: "Start writing your research notes...",
			}),
			CharacterCount,
			Link.configure({
				openOnClick: false,
				HTMLAttributes: { class: "note-link" },
			}),
		],
		content: parseContent(initialContent),
		editable: canEdit,
		onUpdate: ({ editor: e, transaction }) => {
			// Skip saving when the transaction is only a quote highlight application
			if (transaction.getMeta("quoteHighlight")) return;
			const json = e.getJSON() as Record<string, unknown>;
			onContentChange(JSON.stringify(stripHighlightMarks(json)));
		},
		editorProps: {
			attributes: { class: "note-editor-content" },
		},
		immediatelyRender: false,
	});

	// Notify parent when editor is ready
	useEffect(() => {
		if (editor && onEditorReady) {
			onEditorReady(editor);
		}
	}, [editor, onEditorReady]);

	// Quote extraction — selection detection + tooltip state
	const { showTooltip, tooltipPosition, selectedText, selectedOffsets, clearSelection } =
		useQuoteExtraction({ editor, canEdit, containerRef });

	// Quote highlights — apply marks + click-on-highlight detection
	const { clickedQuote, clearClickedQuote } = useQuoteHighlights({
		editor,
		quotes,
		containerRef,
	});

	async function handleExtract() {
		if (!selectedText) return;
		clearSelection();
		await onExtractQuote({
			text: selectedText,
			startOffset: selectedOffsets.startOffset,
			endOffset: selectedOffsets.endOffset,
		});
	}

	if (!editor) {
		return (
			<div
				className="min-h-[400px] rounded-b-xl"
				style={{ background: "var(--color-bg-sunken)" }}
			/>
		);
	}

	return (
		<div
			ref={containerRef}
			className="flex flex-1 flex-col overflow-hidden rounded-b-xl"
			style={{
				background: canEdit ? "var(--color-bg-sunken)" : "var(--color-bg-base)",
				border: "1px solid var(--color-border-subtle)",
				borderTop: "none",
			}}
		>
			{canEdit && <NoteEditorToolbar editor={editor} />}

			<div className="relative flex-1 overflow-y-auto">
				{!canEdit && (
					<div
						className="absolute right-3 top-3 z-10 rounded px-2 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.7rem",
							color: "var(--color-text-muted)",
							background: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						Read only
					</div>
				)}
				<EditorContent editor={editor} className="h-full" />
			</div>

			{canEdit && (
				<div
					className="flex justify-end border-t px-4 py-1.5"
					style={{ borderColor: "var(--color-border-subtle)" }}
				>
					<span
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.7rem",
							color: "var(--color-text-muted)",
						}}
					>
						{editor.storage.characterCount?.characters() ?? 0} chars
					</span>
				</div>
			)}

			{/* Floating "Extract as Quote" tooltip above text selection */}
			<QuoteExtractionTooltip
				visible={showTooltip && canEdit}
				position={tooltipPosition}
				onExtract={handleExtract}
			/>

			{/* Popover shown when clicking an existing quote highlight in the editor */}
			{clickedQuote && (
				<QuoteHighlightPopover
					quote={clickedQuote.quote}
					position={clickedQuote.position}
					onDelete={onDeleteQuote}
					onClose={clearClickedQuote}
					workspaceId={workspaceId}
					projectId={projectId}
				/>
			)}
		</div>
	);
}
