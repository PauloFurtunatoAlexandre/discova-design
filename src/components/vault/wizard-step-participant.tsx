"use client";

import { ArrowRight } from "lucide-react";
import { ParticipantAutocomplete } from "./participant-autocomplete";

interface WizardStepParticipantProps {
	value: string;
	onChange: (v: string) => void;
	projectId: string;
	onNext: () => void;
}

export function WizardStepParticipant({
	value,
	onChange,
	projectId,
	onNext,
}: WizardStepParticipantProps) {
	const canAdvance = value.trim().length > 0;

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && canAdvance) onNext();
	}

	return (
		<div className="flex flex-col gap-6" onKeyDown={handleKeyDown}>
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
					Who was the source?
				</p>
				<p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
					The person interviewed, survey respondent, or data source
				</p>
			</div>

			<ParticipantAutocomplete value={value} onChange={onChange} projectId={projectId} />

			<div className="flex justify-end">
				<button
					type="button"
					onClick={onNext}
					disabled={!canAdvance}
					className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
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
