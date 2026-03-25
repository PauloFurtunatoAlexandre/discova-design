"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { NoteEditorToolbar } from "./note-editor-toolbar";

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

interface NoteEditorProps {
	initialContent: string;
	canEdit: boolean;
	noteId: string;
	onContentChange: (content: string) => void;
	onEditorReady?: (editor: Editor) => void;
}

export function NoteEditor({
	initialContent,
	canEdit,
	onContentChange,
	onEditorReady,
}: NoteEditorProps) {
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
		onUpdate: ({ editor: e }) => {
			onContentChange(JSON.stringify(e.getJSON()));
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
		</div>
	);
}
