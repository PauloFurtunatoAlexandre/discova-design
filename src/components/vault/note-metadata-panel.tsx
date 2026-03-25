"use client";

import { updateNoteMetadataAction, updateNoteTagsAction } from "@/actions/vault";
import type { NoteWithRelations } from "@/lib/queries/vault";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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

const labelStyle: React.CSSProperties = {
	display: "block",
	fontFamily: "var(--font-mono)",
	fontSize: "0.7rem",
	color: "var(--color-text-muted)",
	textTransform: "uppercase",
	letterSpacing: "0.08em",
	marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
	background: "var(--color-bg-sunken)",
	border: "1px solid var(--color-border-default)",
	color: "var(--color-text-primary)",
	width: "100%",
	fontFamily: "var(--font-body)",
};

interface NoteMetadataPanelProps {
	note: NoteWithRelations;
	canEdit: boolean;
	workspaceId: string;
	projectId: string;
	onQuoteClick?: (startOffset: number) => void;
	isOpen: boolean;
	onToggle: () => void;
}

export function NoteMetadataPanel({
	note,
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

	function saveField(
		field: string,
		// biome-ignore lint/suspicious/noExplicitAny: discriminated union value
		value: any,
	) {
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
				className="absolute -left-3 top-8 z-10 hidden h-6 w-6 items-center justify-center rounded-full transition-colors duration-150 hover:opacity-80 focus:outline-none lg:flex"
				style={{
					background: "var(--color-bg-raised)",
					border: "1px solid var(--color-border-default)",
					color: "var(--color-text-muted)",
				}}
			>
				{isOpen ? (
					<ChevronRight size={12} strokeWidth={2.5} />
				) : (
					<ChevronLeft size={12} strokeWidth={2.5} />
				)}
			</button>

			{!isOpen ? null : (
				<div
					className="flex flex-col gap-5 overflow-y-auto"
					style={{ padding: "20px", height: "100%" }}
				>
					{/* Section: DETAILS */}
					<p
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.7rem",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						Details
					</p>

					{/* Research Method */}
					<div>
						<label htmlFor="meta-panel-method" style={labelStyle}>
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
							className="rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={{ ...inputStyle, appearance: "none" }}
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
						<label htmlFor="meta-panel-segment" style={labelStyle}>
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
							className="rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={inputStyle}
						/>
					</div>

					{/* Emotional Tone */}
					<div>
						<label htmlFor="meta-panel-tone" style={labelStyle}>
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
							className="rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={{ ...inputStyle, appearance: "none" }}
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
									className="text-xs capitalize"
									style={{ color: TONE_COLORS[form.emotionalTone], fontFamily: "var(--font-mono)" }}
								>
									{form.emotionalTone}
								</span>
							</div>
						)}
					</div>

					{/* Assumptions Tested */}
					<div>
						<label htmlFor="meta-panel-assumptions" style={labelStyle}>
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
							className="w-full resize-none rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={inputStyle}
						/>
					</div>

					{/* Follow-up Needed */}
					<div className="flex items-center justify-between">
						<p style={labelStyle}>Follow-up Needed</p>
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
						<label htmlFor="meta-panel-recording" style={labelStyle}>
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
							className="rounded-lg px-3 py-2 text-sm focus:outline-none disabled:opacity-50"
							style={inputStyle}
						/>
						{isValidUrl && (
							<a
								href={form.sessionRecordingUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="mt-1 inline-flex items-center gap-1 text-xs hover:opacity-75"
								style={{ color: "var(--color-text-link)", fontFamily: "var(--font-mono)" }}
							>
								Open <ExternalLink size={10} strokeWidth={2} />
							</a>
						)}
					</div>

					{/* Tags */}
					<div>
						<p style={{ ...labelStyle, marginBottom: "8px" }}>Tags</p>
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
					<div style={{ height: "1px", background: "var(--color-border-subtle)" }} />

					{/* Quotes section */}
					<QuotesList quotes={note.quotes} {...(onQuoteClick ? { onQuoteClick } : {})} />

					{/* Separator */}
					<div style={{ height: "1px", background: "var(--color-border-subtle)" }} />

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
