"use client";

import { updateNoteMetadataAction, updateNoteTagsAction } from "@/actions/vault";
import type { NoteQuote, NoteWithRelations } from "@/lib/queries/vault";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useState, useTransition } from "react";
import { LinkedInsightsList } from "./linked-insights-list";
import { QuotesList } from "./quotes-list";
import { TagInput } from "./tag-input";

const STORAGE_KEY = "discova-metadata-panel-open";

const TONE_COLORS: Record<string, string> = {
	frustrated: "var(--color-status-error)",
	delighted: "var(--color-status-success)",
	neutral: "var(--color-text-muted)",
	mixed: "var(--color-status-warning)",
};

interface NoteMetadataPanelProps {
	note: NoteWithRelations;
	/** Live-updated quotes from parent state (replaces note.quotes for reactivity) */
	quotes: NoteQuote[];
	canEdit: boolean;
	workspaceId: string;
	projectId: string;
	onQuoteClick?: (startOffset: number) => void;
	isOpen: boolean;
	onToggle: () => void;
}

export function NoteMetadataPanel({
	note,
	quotes,
	canEdit,
	workspaceId,
	projectId,
	onQuoteClick,
	isOpen,
	onToggle,
}: NoteMetadataPanelProps) {
	const [form, setForm] = useState({
		researchMethod: note.researchMethod ?? "",
		userSegment: note.userSegment ?? "",
		emotionalTone: note.emotionalTone ?? "",
		assumptionsTested: note.assumptionsTested ?? "",
		followUpNeeded: note.followUpNeeded,
		sessionRecordingUrl: note.sessionRecordingUrl ?? "",
		tags: note.tags,
	});
	const [, startTransition] = useTransition();

	function saveField(field: string, value: string | boolean | null) {
		if (!canEdit) return;
		startTransition(async () => {
			await updateNoteMetadataAction({
				workspaceId,
				projectId,
				noteId: note.id,
				field,
				value,
			});
		});
	}

	function saveTags(newTags: string[]) {
		if (!canEdit) return;
		startTransition(async () => {
			await updateNoteTagsAction({
				workspaceId,
				projectId,
				noteId: note.id,
				tags: newTags,
			});
		});
	}

	const isValidUrl = (() => {
		try {
			if (!form.sessionRecordingUrl) return false;
			new URL(form.sessionRecordingUrl);
			return true;
		} catch {
			return false;
		}
	})();

	return (
		<>
			{/* Collapse toggle button (desktop: absolute on edge) */}
			<button
				type="button"
				onClick={onToggle}
				className="absolute -left-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full border border-[--color-border-default] bg-[--color-bg-raised] text-[--color-text-muted] transition-colors duration-150 hover:opacity-80 focus:outline-none lg:flex"
			>
				{isOpen ? (
					<ChevronRight size={12} strokeWidth={2.5} />
				) : (
					<ChevronLeft size={12} strokeWidth={2.5} />
				)}
			</button>

			{!isOpen ? null : (
				<div className="flex flex-col gap-5 overflow-y-auto p-5 h-full">
					{/* Section: DETAILS */}
					<p className="meta-label" style={{ marginBottom: 0 }}>
						Details
					</p>

					{/* Research Method */}
					<div>
						<label htmlFor="meta-panel-method" className="meta-label">
							Research Method
						</label>
						<select
							id="meta-panel-method"
							value={form.researchMethod}
							disabled={!canEdit}
							onChange={(e) => {
								const v = e.target.value || null;
								setForm((f) => ({ ...f, researchMethod: e.target.value }));
								saveField("researchMethod", v);
							}}
							className="meta-input rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={{ appearance: "none" }}
						>
							<option value="">Select method...</option>
							<option value="interview">Interview</option>
							<option value="survey">Survey</option>
							<option value="usability_test">Usability Test</option>
							<option value="observation">Observation</option>
							<option value="other">Other</option>
						</select>
					</div>

					{/* User Segment */}
					<div>
						<label htmlFor="meta-panel-segment" className="meta-label">
							User Segment
						</label>
						<input
							id="meta-panel-segment"
							type="text"
							value={form.userSegment}
							disabled={!canEdit}
							placeholder="e.g., Enterprise Admin"
							maxLength={200}
							onChange={(e) => setForm((f) => ({ ...f, userSegment: e.target.value }))}
							onBlur={(e) => saveField("userSegment", e.target.value || null)}
							className="meta-input rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
						/>
					</div>

					{/* Emotional Tone */}
					<div>
						<label htmlFor="meta-panel-tone" className="meta-label">
							Emotional Tone
						</label>
						<select
							id="meta-panel-tone"
							value={form.emotionalTone}
							disabled={!canEdit}
							onChange={(e) => {
								const v = e.target.value || null;
								setForm((f) => ({ ...f, emotionalTone: e.target.value }));
								saveField("emotionalTone", v);
							}}
							className="meta-input rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={{ appearance: "none" }}
						>
							<option value="">Select tone...</option>
							<option value="frustrated">Frustrated</option>
							<option value="delighted">Delighted</option>
							<option value="neutral">Neutral</option>
							<option value="mixed">Mixed</option>
						</select>
						{form.emotionalTone && TONE_COLORS[form.emotionalTone] && (
							<div className="mt-1.5 flex items-center gap-1.5">
								<span
									className="inline-block h-2 w-2 rounded-full"
									style={{ background: TONE_COLORS[form.emotionalTone] }}
								/>
								<span
									className="font-mono text-xs capitalize"
									style={{ color: TONE_COLORS[form.emotionalTone] }}
								>
									{form.emotionalTone}
								</span>
							</div>
						)}
					</div>

					{/* Assumptions Tested */}
					<div>
						<label htmlFor="meta-panel-assumptions" className="meta-label">
							Assumptions Tested
						</label>
						<textarea
							id="meta-panel-assumptions"
							value={form.assumptionsTested}
							disabled={!canEdit}
							placeholder="What were you validating?"
							rows={2}
							maxLength={2000}
							onChange={(e) => setForm((f) => ({ ...f, assumptionsTested: e.target.value }))}
							onBlur={(e) => saveField("assumptionsTested", e.target.value || null)}
							className="meta-input w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
						/>
					</div>

					{/* Follow-up Needed */}
					<div className="flex items-center justify-between">
						<p className="meta-label" style={{ marginBottom: 0 }}>
							Follow-up Needed
						</p>
						<button
							type="button"
							role="switch"
							aria-checked={form.followUpNeeded}
							disabled={!canEdit}
							onClick={() => {
								const next = !form.followUpNeeded;
								setForm((f) => ({ ...f, followUpNeeded: next }));
								saveField("followUpNeeded", next);
							}}
							className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							style={{
								background: form.followUpNeeded
									? "var(--color-accent-gold)"
									: "var(--color-border-default)",
							}}
						>
							<span
								className="inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200"
								style={{
									transform: form.followUpNeeded ? "translateX(18px)" : "translateX(2px)",
								}}
							/>
						</button>
					</div>

					{/* Session Recording */}
					<div>
						<label htmlFor="meta-panel-recording" className="meta-label">
							Session Recording
						</label>
						<input
							id="meta-panel-recording"
							type="url"
							value={form.sessionRecordingUrl}
							disabled={!canEdit}
							placeholder="https://..."
							onChange={(e) => setForm((f) => ({ ...f, sessionRecordingUrl: e.target.value }))}
							onBlur={(e) => saveField("sessionRecordingUrl", e.target.value || null)}
							className="meta-input rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
						/>
						{isValidUrl && (
							<a
								href={form.sessionRecordingUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-[--color-text-link] hover:opacity-75"
							>
								Open <ExternalLink size={10} strokeWidth={2} />
							</a>
						)}
					</div>

					{/* Tags */}
					<div>
						<p className="meta-label">Tags</p>
						<TagInput
							tags={form.tags}
							onChange={(newTags) => {
								setForm((f) => ({ ...f, tags: newTags }));
								saveTags(newTags);
							}}
							projectId={projectId}
						/>
					</div>

					{/* Separator */}
					<div className="meta-divider" />

					{/* Quotes section */}
					<QuotesList quotes={quotes} {...(onQuoteClick ? { onQuoteClick } : {})} />

					{/* Separator */}
					<div className="meta-divider" />

					{/* Linked insights section */}
					<LinkedInsightsList
						insights={note.linkedInsights}
						workspaceId={workspaceId}
						projectId={projectId}
					/>
				</div>
			)}
		</>
	);
}
