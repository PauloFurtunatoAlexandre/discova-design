"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ConfidenceRangeSliderProps {
	min: number;
	max: number;
	onChange: (min: number, max: number) => void;
}

const SLIDER_MIN = 0;
const SLIDER_MAX = 90;

export function ConfidenceRangeSlider({ min, max, onChange }: ConfidenceRangeSliderProps) {
	const [localMin, setLocalMin] = useState(min);
	const [localMax, setLocalMax] = useState(max);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Sync external changes
	useEffect(() => {
		setLocalMin(min);
		setLocalMax(max);
	}, [min, max]);

	const debouncedChange = useCallback(
		(newMin: number, newMax: number) => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
			debounceRef.current = setTimeout(() => {
				onChange(newMin, newMax);
			}, 300);
		},
		[onChange],
	);

	function handleMinChange(e: React.ChangeEvent<HTMLInputElement>) {
		const val = Math.min(Number(e.target.value), localMax);
		setLocalMin(val);
		debouncedChange(val, localMax);
	}

	function handleMaxChange(e: React.ChangeEvent<HTMLInputElement>) {
		const val = Math.max(Number(e.target.value), localMin);
		setLocalMax(val);
		debouncedChange(localMin, val);
	}

	// Calculate fill positions for the active range highlight
	const minPercent = ((localMin - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;
	const maxPercent = ((localMax - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

	return (
		<div className="flex items-center gap-3">
			{/* Min label */}
			<span
				className="w-9 shrink-0 text-right"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.65rem",
					color: "var(--color-text-muted)",
				}}
			>
				{localMin}%
			</span>

			{/* Slider track */}
			<div className="relative h-4 flex-1" style={{ minWidth: 120 }}>
				{/* Track background */}
				<div
					className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full"
					style={{ background: "var(--color-border-subtle)" }}
				/>

				{/* Active range */}
				<div
					className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full"
					style={{
						left: `${minPercent}%`,
						width: `${maxPercent - minPercent}%`,
						background: "var(--color-accent-blue)",
					}}
				/>

				{/* Min handle */}
				<input
					type="range"
					min={SLIDER_MIN}
					max={SLIDER_MAX}
					value={localMin}
					onChange={handleMinChange}
					aria-label="Minimum confidence"
					className="confidence-slider pointer-events-none absolute inset-0 m-0 w-full appearance-none bg-transparent"
					style={{ zIndex: localMin === localMax ? 3 : 2 }}
				/>

				{/* Max handle */}
				<input
					type="range"
					min={SLIDER_MIN}
					max={SLIDER_MAX}
					value={localMax}
					onChange={handleMaxChange}
					aria-label="Maximum confidence"
					className="confidence-slider pointer-events-none absolute inset-0 m-0 w-full appearance-none bg-transparent"
					style={{ zIndex: 2 }}
				/>
			</div>

			{/* Max label */}
			<span
				className="w-9 shrink-0"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "0.65rem",
					color: "var(--color-text-muted)",
				}}
			>
				{localMax}%
			</span>
		</div>
	);
}
