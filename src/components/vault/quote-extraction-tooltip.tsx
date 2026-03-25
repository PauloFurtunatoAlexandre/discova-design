"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Quote } from "lucide-react";

interface QuoteExtractionTooltipProps {
	position: { x: number; y: number };
	onExtract: () => void;
	visible: boolean;
}

export function QuoteExtractionTooltip({
	position,
	onExtract,
	visible,
}: QuoteExtractionTooltipProps) {
	const prefersReducedMotion = useReducedMotion();

	// Position tooltip above the selection, centered horizontally.
	// Clamp to viewport edges using fixed estimates for the tooltip's rendered size.
	const tooltipWidth = 160;
	const tooltipHeight = 36;
	const gap = 8;

	const rawX = position.x - tooltipWidth / 2;
	const clampedX = Math.max(
		8,
		Math.min(rawX, (typeof window !== "undefined" ? window.innerWidth : 1200) - tooltipWidth - 8),
	);

	const rawY = position.y - tooltipHeight - gap;
	// If would overflow top, show below instead
	const clampedY = rawY < 8 ? position.y + gap + 24 : rawY;

	const style = {
		position: "fixed" as const,
		left: clampedX,
		top: clampedY,
		zIndex: 9999,
		pointerEvents: "auto" as const,
	};

	const motionProps = prefersReducedMotion
		? {
				initial: { opacity: 0 },
				animate: { opacity: 1 },
				exit: { opacity: 0 },
				transition: { duration: 0 },
			}
		: {
				initial: { opacity: 0, scale: 0.9, y: 4 },
				animate: { opacity: 1, scale: 1, y: 0 },
				exit: { opacity: 0, scale: 0.9 },
				transition: { type: "spring" as const, stiffness: 500, damping: 30 },
			};

	return (
		<AnimatePresence>
			{visible && (
				<motion.div
					style={style}
					{...motionProps}
					data-quote-tooltip="true"
					// Prevent mousedown from clearing the editor selection
					onMouseDown={(e) => e.preventDefault()}
				>
					<button
						type="button"
						onClick={onExtract}
						className="flex items-center gap-1.5 rounded-[--radius-md] border border-[--color-border-default] bg-[--color-bg-raised] px-3 py-1.5 shadow-sm transition-colors duration-100 hover:border-[--color-accent-gold-border] hover:bg-[--color-bg-overlay] focus:outline-none"
					>
						<Quote size={14} className="shrink-0 text-[--color-accent-gold]" />
						<span className="whitespace-nowrap font-body text-[0.75rem] font-medium text-[--color-text-primary]">
							Extract as Quote
						</span>
					</button>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
