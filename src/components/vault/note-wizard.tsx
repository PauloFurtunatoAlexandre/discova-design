"use client";

import { createNoteAction } from "@/actions/vault";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { WizardProgress } from "./wizard-progress";
import { WizardStepContent } from "./wizard-step-content";
import { WizardStepDate } from "./wizard-step-date";
import { WizardStepMetadata } from "./wizard-step-metadata";
import { WizardStepParticipant } from "./wizard-step-participant";

interface WizardFormData {
	participantName: string;
	sessionDate: string;
	rawContent: string;
	researchMethod: string | null;
	userSegment: string | null;
	emotionalTone: string | null;
	assumptionsTested: string | null;
	followUpNeeded: boolean;
	sessionRecordingUrl: string | null;
	tags: string[];
}

function getTodayISO(): string {
	return new Date().toISOString().split("T")[0] ?? "";
}

const TOTAL_STEPS = 4;

interface NoteWizardProps {
	workspaceId: string;
	projectId: string;
}

export function NoteWizard({ workspaceId, projectId }: NoteWizardProps) {
	const router = useRouter();
	const prefersReducedMotion = useReducedMotion();
	const [isPending, startTransition] = useTransition();

	const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
	const [direction, setDirection] = useState(1);
	const [error, setError] = useState<string | null>(null);

	const [formData, setFormData] = useState<WizardFormData>({
		participantName: "",
		sessionDate: getTodayISO(),
		rawContent: "",
		researchMethod: null,
		userSegment: null,
		emotionalTone: null,
		assumptionsTested: null,
		followUpNeeded: false,
		sessionRecordingUrl: null,
		tags: [],
	});

	function goToStep(next: 1 | 2 | 3 | 4) {
		setDirection(next > currentStep ? 1 : -1);
		setCurrentStep(next);
		setError(null);
	}

	function updateFormData(updates: Partial<WizardFormData>) {
		setFormData((prev) => ({ ...prev, ...updates }));
	}

	function handleSubmit() {
		setError(null);
		startTransition(async () => {
			const result = await createNoteAction({
				workspaceId,
				projectId,
				participantName: formData.participantName,
				sessionDate: formData.sessionDate,
				rawContent: formData.rawContent,
				researchMethod: formData.researchMethod,
				userSegment: formData.userSegment,
				emotionalTone: formData.emotionalTone,
				assumptionsTested: formData.assumptionsTested,
				followUpNeeded: formData.followUpNeeded,
				sessionRecordingUrl: formData.sessionRecordingUrl,
				tags: formData.tags,
			});

			if ("error" in result) {
				setError(result.error);
				return;
			}

			router.push(`/${workspaceId}/${projectId}/vault/${result.noteId}`);
		});
	}

	const slideVariants = {
		enter: (dir: number) => ({
			x: prefersReducedMotion ? 0 : dir * 40,
			opacity: prefersReducedMotion ? 1 : 0,
		}),
		center: { x: 0, opacity: 1 },
		exit: (dir: number) => ({
			x: prefersReducedMotion ? 0 : dir * -40,
			opacity: prefersReducedMotion ? 1 : 0,
		}),
	};

	const transition = prefersReducedMotion
		? { duration: 0 }
		: { type: "spring" as const, stiffness: 400, damping: 35, duration: 0.2 };

	return (
		<div className="flex flex-col gap-8">
			{/* Back link */}
			<Link
				href={`/${workspaceId}/${projectId}/vault`}
				className="inline-flex items-center gap-2 text-sm transition-colors duration-150 hover:opacity-75 w-fit"
				style={{ color: "var(--color-text-muted)" }}
			>
				<ArrowLeft size={14} strokeWidth={2} />
				Back to Vault
			</Link>

			{/* Header */}
			<div className="flex flex-col gap-1">
				<h1
					style={{
						fontFamily: "var(--font-display)",
						fontSize: "1.5rem",
						color: "var(--color-text-primary)",
					}}
				>
					Add Research Note
				</h1>
				<p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)" }}>
					Capture your research findings
				</p>
			</div>

			{/* Step progress */}
			<WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />

			{/* Step content */}
			<div className="overflow-hidden">
				<AnimatePresence mode="wait" custom={direction}>
					<motion.div
						key={currentStep}
						custom={direction}
						variants={slideVariants}
						initial="enter"
						animate="center"
						exit="exit"
						transition={transition}
					>
						{currentStep === 1 && (
							<WizardStepParticipant
								value={formData.participantName}
								onChange={(v) => updateFormData({ participantName: v })}
								projectId={projectId}
								onNext={() => goToStep(2)}
							/>
						)}

						{currentStep === 2 && (
							<WizardStepDate
								value={formData.sessionDate}
								onChange={(v) => updateFormData({ sessionDate: v })}
								onNext={() => goToStep(3)}
								onBack={() => goToStep(1)}
							/>
						)}

						{currentStep === 3 && (
							<WizardStepContent
								value={formData.rawContent}
								onChange={(v) => updateFormData({ rawContent: v })}
								onBack={() => goToStep(2)}
								onNextWithMetadata={() => goToStep(4)}
								onSubmit={handleSubmit}
								isSubmitting={isPending}
							/>
						)}

						{currentStep === 4 && (
							<WizardStepMetadata
								formData={formData}
								onChange={updateFormData}
								projectId={projectId}
								onBack={() => goToStep(3)}
								onSubmit={handleSubmit}
								onSkip={handleSubmit}
								isSubmitting={isPending}
							/>
						)}
					</motion.div>
				</AnimatePresence>
			</div>

			{/* Error message */}
			{error && (
				<div
					className="rounded-lg px-4 py-3 text-sm"
					style={{
						background: "var(--color-status-error-bg)",
						border: "1px solid var(--color-status-error)",
						color: "var(--color-status-error)",
					}}
					role="alert"
				>
					{error}
				</div>
			)}
		</div>
	);
}
