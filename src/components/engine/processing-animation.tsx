"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface ProcessingAnimationProps {
	status: "reading" | "analysing";
	currentParagraph?: number | undefined;
	totalParagraphs?: number | undefined;
	statusText: string;
}

export function ProcessingAnimation({
	status,
	currentParagraph = 0,
	totalParagraphs = 1,
	statusText,
}: ProcessingAnimationProps) {
	const prefersReducedMotion = useReducedMotion();
	const progress = totalParagraphs > 0 ? currentParagraph / totalParagraphs : 0;

	return (
		<motion.div
			key="processing-animation"
			initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.97 }}
			animate={{ opacity: 1, scale: 1 }}
			exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
			transition={
				prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 28 }
			}
			className="flex flex-col items-center justify-center rounded-xl p-8 text-center"
			style={{
				background: "color-mix(in srgb, var(--color-bg-surface) 95%, transparent)",
				backdropFilter: "blur(2px)",
				border: "1px solid var(--color-border-subtle)",
			}}
		>
			{/* Status text */}
			<AnimatePresence mode="wait">
				<motion.p
					key={statusText}
					initial={prefersReducedMotion ? {} : { opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={prefersReducedMotion ? {} : { opacity: 0 }}
					transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
					className="mb-5"
					style={{
						fontFamily: "var(--font-display)",
						fontSize: "1rem",
						color: "var(--color-text-primary)",
					}}
				>
					{statusText}
				</motion.p>
			</AnimatePresence>

			{/* Progress bar */}
			<div
				className="mb-3 overflow-hidden rounded-full"
				style={{
					width: "200px",
					height: "3px",
					background: "var(--color-border-subtle)",
				}}
			>
				<motion.div
					className="h-full rounded-full"
					style={{ background: "var(--color-accent-blue)" }}
					animate={{
						width: status === "analysing" ? "90%" : `${Math.max(progress * 100, 5)}%`,
					}}
					transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: "easeOut" }}
				/>
			</div>

			{/* Paragraph indicator — reading state only */}
			<AnimatePresence>
				{status === "reading" && totalParagraphs > 0 && (
					<motion.p
						initial={prefersReducedMotion ? {} : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={prefersReducedMotion ? {} : { opacity: 0 }}
						transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
						className="mb-4"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.7rem",
							color: "var(--color-text-muted)",
						}}
					>
						Reading paragraph {currentParagraph + 1} of {totalParagraphs}
					</motion.p>
				)}
			</AnimatePresence>

			{/* Animated dots — analysing state */}
			<AnimatePresence>
				{status === "analysing" && (
					<motion.div
						initial={prefersReducedMotion ? {} : { opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="flex items-center gap-1.5"
					>
						{[0, 1, 2].map((i) =>
							prefersReducedMotion ? (
								<span
									key={i}
									className="h-1.5 w-1.5 rounded-full"
									style={{ background: "var(--color-accent-blue)" }}
								/>
							) : (
								<motion.span
									key={i}
									className="h-1.5 w-1.5 rounded-full"
									style={{ background: "var(--color-accent-blue)" }}
									animate={{ opacity: [0.3, 1, 0.3] }}
									transition={{
										duration: 1.2,
										repeat: Number.POSITIVE_INFINITY,
										delay: i * 0.2,
										ease: "easeInOut",
									}}
								/>
							),
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
