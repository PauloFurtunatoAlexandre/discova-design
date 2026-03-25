"use client";

import { animate, useMotionValue, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const RADIUS = 50;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 120;
const STROKE_WIDTH = 7;

interface PhaseRingProps {
	label: string;
	percentage: number;
	completed: number;
	total: number;
	color: string;
	glowColor: string;
	href: string;
	index?: number;
}

export function PhaseRing({
	label,
	percentage,
	completed,
	total,
	color,
	glowColor,
	href,
	index = 0,
}: PhaseRingProps) {
	const router = useRouter();
	const prefersReducedMotion = useReducedMotion();
	const circleRef = useRef<SVGCircleElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const motionValue = useMotionValue(0);

	const offset = CIRCUMFERENCE - (percentage / 100) * CIRCUMFERENCE;

	useEffect(() => {
		if (prefersReducedMotion) {
			if (circleRef.current) {
				circleRef.current.style.strokeDashoffset = String(offset);
			}
			if (textRef.current) {
				textRef.current.textContent = `${percentage}%`;
			}
			return;
		}

		const delay = index * 80;

		const controls = animate(motionValue, percentage, {
			duration: 1.2,
			delay: delay / 1000,
			ease: [0.16, 1, 0.3, 1],
			onUpdate(v) {
				const currentOffset = CIRCUMFERENCE - (v / 100) * CIRCUMFERENCE;
				if (circleRef.current) {
					circleRef.current.style.strokeDashoffset = String(currentOffset);
				}
				if (textRef.current) {
					textRef.current.textContent = `${Math.round(v)}%`;
				}
			},
		});

		return () => controls.stop();
	}, [percentage, offset, index, prefersReducedMotion, motionValue]);

	return (
		<button
			type="button"
			onClick={() => router.push(href)}
			className="group flex flex-col items-center gap-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus rounded-xl p-2 -m-2"
			aria-label={`${label}: ${percentage}% complete (${completed} of ${total})`}
		>
			<div className="relative transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:scale-[1.02]">
				<svg
					width={SIZE}
					height={SIZE}
					viewBox={`0 0 ${SIZE} ${SIZE}`}
					className="rotate-[-90deg]"
					aria-hidden="true"
				>
					{/* Glow filter */}
					<defs>
						<filter id={`glow-${label}`} x="-50%" y="-50%" width="200%" height="200%">
							<feGaussianBlur stdDeviation="3" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					{/* Track */}
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke="var(--color-border-subtle)"
						strokeWidth={STROKE_WIDTH}
					/>

					{/* Progress arc */}
					<circle
						ref={circleRef}
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={RADIUS}
						fill="none"
						stroke={color}
						strokeWidth={STROKE_WIDTH}
						strokeLinecap="round"
						strokeDasharray={CIRCUMFERENCE}
						strokeDashoffset={prefersReducedMotion ? offset : CIRCUMFERENCE}
						style={{
							filter: percentage > 0 ? `url(#glow-${label})` : undefined,
							transition: prefersReducedMotion ? "none" : undefined,
						}}
					/>
				</svg>

				{/* Center text */}
				<div className="absolute inset-0 flex items-center justify-center">
					<span
						ref={textRef}
						className="text-lg font-semibold tabular-nums"
						style={{ color: percentage > 0 ? color : "var(--color-text-muted)" }}
					>
						{prefersReducedMotion ? `${percentage}%` : "0%"}
					</span>
				</div>
			</div>

			{/* Label + subtitle */}
			<div className="text-center">
				<p
					className="text-sm font-medium transition-colors duration-150"
					style={{ color: "var(--color-text-secondary)" }}
				>
					{label}
				</p>
				<p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
					{total === 0 ? "No data yet" : `${completed} / ${total}`}
				</p>
			</div>
		</button>
	);
}
