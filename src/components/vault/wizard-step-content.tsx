"use client";

import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useRef } from "react";

interface WizardStepContentProps {
	value: string;
	onChange: (v: string) => void;
	onBack: () => void;
	onNextWithMetadata: () => void;
	onSubmit: () => void;
	isSubmitting: boolean;
}

export function WizardStepContent({
	value,
	onChange,
	onBack,
	onNextWithMetadata,
	onSubmit,
	isSubmitting,
}: WizardStepContentProps) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const canSubmit = value.trim().length > 0 && !isSubmitting;

	function autoResize() {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}

	return (
		<div className="flex flex-col gap-6">
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
					Your research notes
				</p>
				<p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
					Paste, type, or dictate your raw findings. You can format and enrich later.
				</p>
			</div>

			<div className="flex flex-col gap-1.5">
				<textarea
					ref={textareaRef}
					value={value}
					onChange={(e) => {
						onChange(e.target.value);
						autoResize();
					}}
					placeholder={
						"Paste your interview notes, observations, or findings here...\n\nYou'll be able to highlight key quotes and extract insights in the next step."
					}
					rows={10}
					className="w-full resize-none rounded-lg px-4 py-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					style={{
						background: "var(--color-bg-sunken)",
						border: "1px solid var(--color-border-default)",
						color: "var(--color-text-primary)",
						fontFamily: "var(--font-body)",
						lineHeight: "1.7",
						minHeight: "240px",
					}}
					onFocus={(e) => {
						(e.target as HTMLTextAreaElement).style.border = "1px solid var(--color-border-strong)";
					}}
					onBlur={(e) => {
						(e.target as HTMLTextAreaElement).style.border =
							"1px solid var(--color-border-default)";
					}}
				/>
				<p
					className="text-right"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
					}}
				>
					{value.length} chars
				</p>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<button
					type="button"
					onClick={onBack}
					className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					style={{ color: "var(--color-text-secondary)" }}
				>
					<ArrowLeft size={15} strokeWidth={2} />
					Back
				</button>

				<div className="flex flex-col gap-2 sm:flex-row">
					{/* Add metadata → secondary */}
					<button
						type="button"
						onClick={onNextWithMetadata}
						disabled={!canSubmit}
						className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-[--color-bg-item-hover] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={{
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-secondary)",
						}}
					>
						Add Metadata
						<ArrowRight size={15} strokeWidth={2} />
					</button>

					{/* Create Note → primary */}
					<button
						type="button"
						onClick={onSubmit}
						disabled={!canSubmit}
						className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
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
		</div>
	);
}
