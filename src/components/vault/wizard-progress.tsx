"use client";

import { motion, useReducedMotion } from "framer-motion";

interface WizardProgressProps {
	currentStep: number;
	totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
	const prefersReducedMotion = useReducedMotion();

	return (
		<div className="flex flex-col items-start gap-2">
			<div className="flex items-center gap-2">
				{Array.from({ length: totalSteps }, (_, i) => {
					const step = i + 1;
					const isActive = step === currentStep;
					const isCompleted = step < currentStep;

					return (
						<motion.div
							key={step}
							animate={
								prefersReducedMotion
									? {}
									: {
											scale: isActive ? 1.25 : 1,
											opacity: isCompleted ? 0.5 : 1,
										}
							}
							transition={{ type: "spring", stiffness: 500, damping: 30 }}
							style={{
								width: 10,
								height: 10,
								borderRadius: "50%",
								background:
									isActive || isCompleted
										? "var(--color-accent-gold)"
										: "var(--color-border-default)",
								opacity: isCompleted ? 0.5 : undefined,
							}}
						/>
					);
				})}
			</div>
			<span
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.75rem",
					color: "var(--color-text-muted)",
				}}
			>
				Step {currentStep} of {totalSteps}
			</span>
		</div>
	);
}
