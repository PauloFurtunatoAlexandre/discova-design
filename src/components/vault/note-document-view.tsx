"use client";

import { createQuoteAction, deleteQuoteAction, markQuoteStaleAction } from "@/actions/quotes";
import { updateNoteContentAction } from "@/actions/vault";
import { AnalysisView } from "@/components/engine/analysis-view";
import { useAnalysis } from "@/hooks/useAnalysis";
import { useAutoSave } from "@/hooks/useAutoSave";
import type { NoteQuote, NoteWithRelations } from "@/lib/queries/vault";
import { getPlainTextAtRange } from "@/lib/vault/quote-offsets";
import type { Editor } from "@tiptap/react";
import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
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

function countParagraphs(rawContent: string): number {
	try {
		const doc = JSON.parse(rawContent) as { type?: string; content?: Array<{ type?: string }> };
		if (doc?.type === "doc" && Array.isArray(doc.content)) {
			const n = doc.content.filter((node) => node.type === "paragraph").length;
			return Math.max(n, 1);
		}
	} catch {
		// plain text
	}
	return Math.max(rawContent.split("\n").filter((l) => l.trim()).length, 1);
}

export function NoteDocumentView({ note, workspaceId, projectId, canEdit }: NoteDocumentViewProps) {
	const prefersReducedMotion = useReducedMotion();
	const editorRef = useRef<Editor | null>(null);
	const quotesRef = useRef<NoteQuote[]>(note.quotes);

	// ── Analysis ────────────────────────────────────────────────────────────────
	const totalParagraphs = useMemo(() => countParagraphs(note.rawContent), [note.rawContent]);
	const {
		state: analysisState,
		suggestions,
		startAnalysis,
		retry,
		dismissSuggestion,
		isLoading: isAnalysing,
	} = useAnalysis({ noteId: note.id, workspaceId, projectId, totalParagraphs });

	const showAnalyseAgain = analysisState.status === "complete" && suggestions.length === 0;
	const hideAnalyseButton = analysisState.status === "complete" && suggestions.length > 0;
	const editorDimmed = analysisState.status === "reading" || analysisState.status === "analysing";

	// Live quotes state — updated optimistically on create/delete
	const [quotes, setQuotes] = useState<NoteQuote[]>(note.quotes);
	quotesRef.current = quotes;

	// Panel open/close state — persisted to localStorage
	const [panelOpen, setPanelOpen] = useState<boolean>(() => {
		if (typeof window === "undefined") return true;
		const stored = localStorage.getItem(STORAGE_KEY);
		return stored === null ? true : stored === "true";
	});

	// ── Staleness Check ─────────────────────────────────────────────────────────
	// Runs after each auto-save to detect quotes whose text no longer matches
	// the content at their stored positions.
	function checkQuoteStaleness() {
		const editor = editorRef.current;
		if (!editor) return;

		const currentQuotes = quotesRef.current;
		const newStaleIds: string[] = [];

		for (const quote of currentQuotes) {
			if (quote.isStale) continue;
			const currentText = getPlainTextAtRange(editor, quote.startOffset, quote.endOffset);
			if (currentText !== quote.text) {
				newStaleIds.push(quote.id);
			}
		}

		if (newStaleIds.length > 0) {
			for (const quoteId of newStaleIds) {
				markQuoteStaleAction({ workspaceId, projectId, quoteId }).catch(() => {});
			}
			setQuotes((prev) =>
				prev.map((q) => (newStaleIds.includes(q.id) ? { ...q, isStale: true } : q)),
			);
		}
	}

	// ── Auto-save ───────────────────────────────────────────────────────────────
	// biome-ignore lint/correctness/useExhaustiveDependencies: checkQuoteStaleness intentionally excluded to avoid recreating handleSave on every staleness check
	const handleSave = useCallback(
		async (content: string) => {
			await updateNoteContentAction({ workspaceId, projectId, noteId: note.id, content });
			// Check staleness after each save (same debounce cadence)
			checkQuoteStaleness();
		},
		[workspaceId, projectId, note.id],
	);

	const { status: saveStatus, triggerSave } = useAutoSave({ delay: 2000, onSave: handleSave });

	// ── Panel toggle ────────────────────────────────────────────────────────────
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

	// ── Quote Click (from metadata panel) ───────────────────────────────────────
	// Scrolls the editor to the quote position and briefly flashes it.
	function handleQuoteClick(startOffset: number) {
		const editor = editorRef.current;
		if (!editor) return;
		try {
			editor.commands.setTextSelection(startOffset);
			editor.commands.scrollIntoView();
			// Flash the mark element
			setTimeout(() => {
				try {
					const { node } = editor.view.domAtPos(startOffset);
					const markEl =
						node.nodeType === Node.TEXT_NODE
							? (node as Text).parentElement?.closest("mark.quote-highlight")
							: (node as Element).closest?.("mark.quote-highlight");
					if (markEl) {
						markEl.classList.add("flashing");
						setTimeout(() => markEl.classList.remove("flashing"), 600);
					}
				} catch {
					// ignore — mark may not exist at this position
				}
			}, 50);
		} catch {
			// Offset out of range if content changed
		}
	}

	// ── Quote Extract ────────────────────────────────────────────────────────────
	async function handleExtractQuote(offsets: {
		text: string;
		startOffset: number;
		endOffset: number;
	}) {
		const result = await createQuoteAction({
			workspaceId,
			projectId,
			noteId: note.id,
			text: offsets.text,
			startOffset: offsets.startOffset,
			endOffset: offsets.endOffset,
		});

		if ("success" in result && result.success) {
			// Optimistically add the new quote to state
			setQuotes((prev) => [
				...prev,
				{
					id: result.quote.id,
					text: result.quote.text,
					startOffset: result.quote.startOffset,
					endOffset: result.quote.endOffset,
					isStale: result.quote.isStale,
					linkedInsightCount: 0,
				},
			]);
		}
	}

	// ── Quote Delete ─────────────────────────────────────────────────────────────
	async function handleDeleteQuote(quoteId: string, force: boolean) {
		const result = await deleteQuoteAction({ workspaceId, projectId, quoteId, force });

		if ("success" in result && result.success) {
			// Remove from local state
			setQuotes((prev) => prev.filter((q) => q.id !== quoteId));
		}
		// If warning returned (edge case, shouldn't happen since UI handles confirmation),
		// we silently ignore — the popover already asked for confirmation.
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
				onAnalyse={
					canEdit && !hideAnalyseButton
						? () => {
								startAnalysis();
							}
						: undefined
				}
				isAnalysing={isAnalysing}
				showAnalyseAgain={showAnalyseAgain}
			/>

			{/* Two-panel body */}
			<div className="flex flex-1 overflow-hidden lg:flex-row flex-col">
				{/* Left: Editor */}
				<div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
					<AnalysisView
						state={analysisState}
						suggestions={suggestions}
						onDismiss={dismissSuggestion}
						onRetry={retry}
					/>
					<div
						style={{
							opacity: editorDimmed ? 0.5 : 1,
							pointerEvents: editorDimmed ? "none" : undefined,
							transition: "opacity 300ms",
						}}
					>
						<NoteEditor
							initialContent={note.rawContent}
							canEdit={canEdit}
							noteId={note.id}
							workspaceId={workspaceId}
							projectId={projectId}
							quotes={quotes}
							onContentChange={triggerSave}
							onEditorReady={handleEditorReady}
							onExtractQuote={handleExtractQuote}
							onDeleteQuote={handleDeleteQuote}
						/>
					</div>
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
							quotes={quotes}
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
						className="hidden h-full w-6 shrink-0 items-center justify-center transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] lg:flex"
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
