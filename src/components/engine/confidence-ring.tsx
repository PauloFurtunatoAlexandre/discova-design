"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfidenceRingProps {
	score: number;
	size?: "sm" | "md" | "lg" | undefined;
	animated?: boolean | undefined;
}

const SIZE_CONFIG = {
	sm: { dim: 32, r: 11, cx: 16, cy: 16, strokeTrack: 2, strokeProgress: 2.5, textSize: "0.6rem" },
	md: { dim: 56, r: 20, cx: 28, cy: 28, strokeTrack: 3, strokeProgress: 3.5, textSize: "0.75rem" },
	lg: { dim: 80, r: 30, cx: 40, cy: 40, strokeTrack: 4, strokeProgress: 5, textSize: "0.875rem" },
} as const;

function getScoreColor(score: number): string {
	if (score < 30) return "var(--color-status-error)";
	if (score < 60) return "var(--color-status-warning)";
	return "var(--color-status-success)";
}

function getScoreLabel(score: number): string {
	if (score < 30) return "Low";
	if (score < 60) return "Medium";
	return "High";
}

export function ConfidenceRing({ score, size = "md", animated = true }: ConfidenceRingProps) {
	const prefersReducedMotion = useReducedMotion();
	const effectiveScore = Math.min(score, 90);
	const config = SIZE_CONFIG[size];

	const circumference = 2 * Math.PI * config.r;
	const targetOffset = circumference * (1 - effectiveScore / 100);
	const shouldAnimate = animated && !prefersReducedMotion;

	// MotionValue drives the ring's strokeDashoffset animation only
	const progressValue = useMotionValue(shouldAnimate ? circumference : targetOffset);

	// Plain state drives the displayed counter text (avoids MotionValue-as-child issues)
	const [displayPct, setDisplayPct] = useState(shouldAnimate ? 0 : effectiveScore);

	useEffect(() => {
		if (!shouldAnimate) {
			progressValue.set(targetOffset);
			setDisplayPct(effectiveScore);
			return;
		}

		// Animate the ring draw
		const controls = animate(progressValue, targetOffset, {
			type: "spring",
			stiffness: 60,
			damping: 15,
			onUpdate: (v) => {
				// Derive displayed percentage from current dashoffset
				const pct = Math.round((1 - v / circumference) * 100);
				setDisplayPct(Math.max(0, Math.min(pct, 90)));
			},
		});
		return controls.stop;
	}, [shouldAnimate, progressValue, targetOffset, effectiveScore, circumference]);

	const color = getScoreColor(effectiveScore);
	const showLabel = size === "md" || size === "lg";
	const tooltipText =
		effectiveScore >= 90
			? "Confidence is capped at 90%. Research supports but never proves."
			: undefined;

	return (
		<div
			className="flex flex-col items-center gap-0.5"
			title={tooltipText}
			data-testid="confidence-ring"
			data-score-range={getScoreLabel(effectiveScore).toLowerCase()}
		>
			{/* Ring + centered score text */}
			<div style={{ position: "relative", width: config.dim, height: config.dim }}>
				<svg
					width={config.dim}
					height={config.dim}
					viewBox={`0 0 ${config.dim} ${config.dim}`}
					style={{ transform: "rotate(-90deg)" }}
					aria-label={`Confidence: ${effectiveScore}%`}
					role="img"
				>
					{/* Track circle */}
					<circle
						cx={config.cx}
						cy={config.cy}
						r={config.r}
						fill="none"
						stroke="var(--color-border-subtle)"
						strokeWidth={config.strokeTrack}
					/>

					{/* Progress circle — animated via MotionValue */}
					<motion.circle
						cx={config.cx}
						cy={config.cy}
						r={config.r}
						fill="none"
						stroke={color}
						strokeWidth={config.strokeProgress}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={progressValue}
						data-testid="confidence-ring-progress"
					/>
				</svg>

				{/* Center text overlay — plain state, not MotionValue */}
				<div
					style={{
						position: "absolute",
						inset: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						pointerEvents: "none",
					}}
				>
					<span
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: config.textSize,
							fontWeight: 600,
							color,
						}}
					>
						{displayPct}%
					</span>
				</div>
			</div>

			{/* Label below ring (md + lg only) */}
			{showLabel && (
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.65rem",
						color,
					}}
				>
					{getScoreLabel(effectiveScore)}
				</span>
			)}
		</div>
	);
}
