"use client";

import type { SaveStatus } from "@/hooks/useAutoSave";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

interface SaveIndicatorProps {
	status: SaveStatus;
}

export function SaveIndicator({ status }: SaveIndicatorProps) {
	const prefersReducedMotion = useReducedMotion();

	if (status === "idle") return null;

	return (
		<AnimatePresence mode="wait">
			{status === "saving" && (
				<motion.span
					key="saving"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
					className="inline-flex items-center gap-1.5"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
					}}
				>
					<motion.span
						className="inline-block h-1.5 w-1.5 rounded-full"
						style={{ background: "var(--color-accent-gold)" }}
						animate={prefersReducedMotion ? {} : { opacity: [0.3, 1, 0.3] }}
						transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
					/>
					Saving...
				</motion.span>
			)}

			{status === "saved" && (
				<motion.span
					key="saved"
					initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
					className="inline-flex items-center gap-1"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						color: "var(--color-status-success)",
					}}
				>
					<Check size={12} strokeWidth={2.5} />
					Saved
				</motion.span>
			)}

			{status === "error" && (
				<motion.span
					key="error"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.75rem",
						color: "var(--color-status-error)",
					}}
				>
					Save failed
				</motion.span>
			)}
		</AnimatePresence>
	);
}
