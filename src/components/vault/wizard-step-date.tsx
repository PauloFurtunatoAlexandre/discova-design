"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";

interface WizardStepDateProps {
	value: string; // "YYYY-MM-DD"
	onChange: (v: string) => void;
	onNext: () => void;
	onBack: () => void;
}

function formatDisplayDate(dateStr: string): string {
	if (!dateStr) return "No date selected";
	// Append noon UTC to avoid timezone-shifted date display
	const d = new Date(`${dateStr}T12:00:00`);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function WizardStepDate({ value, onChange, onNext, onBack }: WizardStepDateProps) {
	const today = new Date().toISOString().split("T")[0];

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
					When did this happen?
				</p>
				<p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
					The date of the interview, survey, or observation
				</p>
			</div>

			{/* Selected date display */}
			<div
				className="rounded-lg px-4 py-3"
				style={{
					background: "var(--color-bg-overlay)",
					border: "1px solid var(--color-accent-gold-border)",
				}}
			>
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "1.125rem",
						color: "var(--color-text-primary)",
					}}
				>
					{formatDisplayDate(value)}
				</span>
			</div>

			{/* Date input */}
			<input
				type="date"
				value={value}
				max={today}
				onChange={(e) => onChange(e.target.value)}
				className="w-full rounded-lg px-4 py-3 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] focus:ring-2"
				style={{
					background: "var(--color-bg-sunken)",
					border: "1px solid var(--color-border-default)",
					color: "var(--color-text-primary)",
					colorScheme: "dark",
				}}
			/>

			<div className="flex items-center justify-between">
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
					onClick={onNext}
					disabled={!value}
					className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
					style={{
						background: "var(--color-accent-gold)",
						color: "var(--color-text-inverse)",
					}}
				>
					Next
					<ArrowRight size={15} strokeWidth={2} />
				</button>
			</div>
		</div>
	);
}
