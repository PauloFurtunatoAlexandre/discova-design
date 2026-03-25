"use client";

import { ArrowLeft, Plus } from "lucide-react";
import { TagInput } from "./tag-input";

interface MetadataFormData {
	researchMethod: string | null;
	userSegment: string | null;
	emotionalTone: string | null;
	assumptionsTested: string | null;
	followUpNeeded: boolean;
	sessionRecordingUrl: string | null;
	tags: string[];
}

interface WizardStepMetadataProps {
	formData: MetadataFormData;
	onChange: (updates: Partial<MetadataFormData>) => void;
	projectId: string;
	onBack: () => void;
	onSubmit: () => void;
	onSkip: () => void;
	isSubmitting: boolean;
}

const TONE_COLORS: Record<string, string> = {
	frustrated: "var(--color-status-error)",
	delighted: "var(--color-status-success)",
	neutral: "var(--color-text-muted)",
	mixed: "var(--color-status-warning)",
};

const labelStyle: React.CSSProperties = {
	display: "block",
	fontFamily: "var(--font-mono)",
	fontSize: "0.75rem",
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
};

export function WizardStepMetadata({
	formData,
	onChange,
	projectId,
	onBack,
	onSubmit,
	onSkip,
	isSubmitting,
}: WizardStepMetadataProps) {
	return (
		<div className="flex flex-col gap-6">
			{/* Header row with skip */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex flex-col gap-1.5">
					<p
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.75rem",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						Add context (optional)
					</p>
					<p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
						All fields are optional. You can always add this later.
					</p>
				</div>

				<button
					type="button"
					onClick={onSkip}
					disabled={isSubmitting}
					className="shrink-0 text-sm font-medium transition-colors duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] disabled:opacity-40"
					style={{ color: "var(--color-accent-gold)", fontFamily: "var(--font-body)" }}
				>
					{isSubmitting ? "Creating..." : "Skip & Create Note"}
				</button>
			</div>

			{/* Fields */}
			<div className="flex flex-col gap-5">
				{/* Research Method */}
				<div>
					<label htmlFor="meta-method" style={labelStyle}>
						Research Method
					</label>
					<select
						id="meta-method"
						value={formData.researchMethod ?? ""}
						onChange={(e) => onChange({ researchMethod: e.target.value || null })}
						className="w-full rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
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
					<label htmlFor="meta-segment" style={labelStyle}>
						User Segment / Persona
					</label>
					<input
						id="meta-segment"
						type="text"
						value={formData.userSegment ?? ""}
						onChange={(e) => onChange({ userSegment: e.target.value || null })}
						placeholder="e.g., Enterprise Admin, Free Tier User"
						maxLength={200}
						className="rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={inputStyle}
					/>
				</div>

				{/* Emotional Tone */}
				<div>
					<label htmlFor="meta-tone" style={labelStyle}>
						Emotional Tone
					</label>
					<select
						id="meta-tone"
						value={formData.emotionalTone ?? ""}
						onChange={(e) => onChange({ emotionalTone: e.target.value || null })}
						className="w-full rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={{ ...inputStyle, appearance: "none" }}
					>
						<option value="">Select tone...</option>
						{Object.entries(TONE_COLORS).map(([tone]) => (
							<option key={tone} value={tone}>
								{tone.charAt(0).toUpperCase() + tone.slice(1)}
							</option>
						))}
					</select>
					{formData.emotionalTone && (
						<div className="mt-2 flex items-center gap-2">
							<div
								className="h-2 w-2 rounded-full"
								style={{ background: TONE_COLORS[formData.emotionalTone] }}
							/>
							<span
								className="text-xs capitalize"
								style={{ color: TONE_COLORS[formData.emotionalTone] }}
							>
								{formData.emotionalTone}
							</span>
						</div>
					)}
				</div>

				{/* Assumptions Tested */}
				<div>
					<label htmlFor="meta-assumptions" style={labelStyle}>
						Assumptions Tested
					</label>
					<textarea
						id="meta-assumptions"
						value={formData.assumptionsTested ?? ""}
						onChange={(e) => onChange({ assumptionsTested: e.target.value || null })}
						placeholder="What hypotheses were you validating?"
						rows={2}
						maxLength={2000}
						className="w-full resize-none rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={inputStyle}
					/>
				</div>

				{/* Follow-up Needed */}
				<div className="flex items-center justify-between">
					<p
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.75rem",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.08em",
						}}
					>
						Follow-up Needed
					</p>
					<button
						type="button"
						role="switch"
						aria-checked={formData.followUpNeeded}
						onClick={() => onChange({ followUpNeeded: !formData.followUpNeeded })}
						className="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] focus-visible:ring-2 focus-visible:ring-offset-2"
						style={{
							background: formData.followUpNeeded
								? "var(--color-accent-gold)"
								: "var(--color-border-default)",
						}}
					>
						<span
							className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
							style={{
								transform: formData.followUpNeeded ? "translateX(22px)" : "translateX(4px)",
							}}
						/>
					</button>
				</div>

				{/* Session Recording URL */}
				<div>
					<label htmlFor="meta-recording" style={labelStyle}>
						Session Recording
					</label>
					<input
						id="meta-recording"
						type="url"
						value={formData.sessionRecordingUrl ?? ""}
						onChange={(e) => onChange({ sessionRecordingUrl: e.target.value || null })}
						placeholder="https://..."
						className="rounded-lg px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={inputStyle}
					/>
				</div>

				{/* Tags */}
				<div>
					<p style={labelStyle}>Tags</p>
					<TagInput
						tags={formData.tags}
						onChange={(newTags) => onChange({ tags: newTags })}
						projectId={projectId}
					/>
				</div>
			</div>

			{/* Navigation */}
			<div className="flex items-center justify-between pt-2">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					style={{ color: "var(--color-text-secondary)" }}
				>
					<ArrowLeft size={15} strokeWidth={2} />
					Back
				</button>

				<button
					type="button"
					onClick={onSubmit}
					disabled={isSubmitting}
					className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					style={{
						background: "var(--color-accent-gold)",
						color: "var(--color-text-inverse)",
					}}
				>
					{isSubmitting ? (
						"Creating..."
					) : (
						<>
							<Plus size={15} strokeWidth={2} />
							Create Note
						</>
					)}
				</button>
			</div>
		</div>
	);
}
