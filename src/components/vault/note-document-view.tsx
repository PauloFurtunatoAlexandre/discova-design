"use client";

import { updateNoteContentAction } from "@/actions/vault";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { NoteWithRelations } from "@/lib/queries/vault";
import type { Editor } from "@tiptap/react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { NoteEditor } from "./note-editor";
import { NoteHeader } from "./note-header";
import { NoteMetadataPanel } from "./note-metadata-panel";

interface NoteDocumentViewProps {
	note: NoteWithRelations;
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
}

const STORAGE_KEY = "discova-metadata-panel-open";

export function NoteDocumentView({ note, workspaceId, projectId, canEdit }: NoteDocumentViewProps) {
	const prefersReducedMotion = useReducedMotion();
	const editorRef = useRef<Editor | null>(null);

	// Panel open/close state — persisted to localStorage
	const [panelOpen, setPanelOpen] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === null ? true : stored === "true";
	});

	// Auto-save for editor content
	const handleSave = useCallback(
		async (content: string) => {
			await updateNoteContentAction({
				workspaceId,
				projectId,
				noteId: note.id,
				content,
			});
		},
		[workspaceId, projectId, note.id],
	);

	const { status: saveStatus, triggerSave } = useAutoSave({ delay: 2000, onSave: handleSave });

	function togglePanel() {
		setPanelOpen((prev) => {
			const next = !prev;
			localStorage.setItem(STORAGE_KEY, String(next));
			return next;
		});
	}

	function handleEditorReady(editor: Editor) {
		editorRef.current = editor;
	}

	function handleQuoteClick(startOffset: number) {
		const editor = editorRef.current;
		if (!editor) return;
		try {
			editor.commands.setTextSelection(startOffset);
			editor.commands.scrollIntoView();
		} catch {
			// Offset may be out of range if content has changed
		}
	}

	return (
		<div className="flex h-full flex-col">
			<NoteHeader
				participantName={note.participantName}
				sessionDate={note.sessionDate}
				workspaceId={workspaceId}
				projectId={projectId}
				noteId={note.id}
				canEdit={canEdit}
				saveStatus={saveStatus}
			/>

			{/* Two-panel body */}
			<div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
				{/* Left: Editor */}
				<div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
					<NoteEditor
						initialContent={note.rawContent}
						canEdit={canEdit}
						noteId={note.id}
						onContentChange={triggerSave}
						onEditorReady={handleEditorReady}
					/>
				</div>

				{/* Right: Metadata panel */}
				<motion.div
					className="relative overflow-hidden border-t lg:border-t-0 lg:border-l shrink-0"
					style={{ borderColor: "var(--color-border-subtle)" }}
					animate={{
						width: panelOpen
							? typeof window !== "undefined" && window.innerWidth < 1024
								? "100%"
								: "320px"
							: "0px",
					}}
					initial={false}
					transition={
						prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }
					}
				>
					<div
						className="h-full"
						style={{
							background: "var(--color-bg-surface)",
							minWidth: "320px",
						}}
					>
						<NoteMetadataPanel
							note={note}
							canEdit={canEdit}
							workspaceId={workspaceId}
							projectId={projectId}
							onQuoteClick={handleQuoteClick}
							isOpen={panelOpen}
							onToggle={togglePanel}
						/>
					</div>
				</motion.div>

				{/* Collapsed panel toggle (when panel is closed on desktop) */}
				{!panelOpen && (
					<button
						type="button"
						onClick={togglePanel}
						className="hidden h-full w-6 shrink-0 items-center justify-center transition-colors duration-150 hover:bg-white/5 focus:outline-none lg:flex"
						style={{
							background: "var(--color-bg-surface)",
							borderLeft: "1px solid var(--color-border-subtle)",
							color: "var(--color-text-muted)",
						}}
					>
						<span
							style={{
								writingMode: "vertical-rl",
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.1em",
								userSelect: "none",
							}}
						>
							Details
						</span>
					</button>
				)}
			</div>
		</div>
	);
}
