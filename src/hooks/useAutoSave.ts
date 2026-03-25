"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UseAutoSaveOptions {
	/** Debounce delay in milliseconds. Default: 2000 */
	delay?: number;
	/** Save function — receives the current value */
	onSave: (value: string) => Promise<void>;
}

/**
 * Debounced auto-save hook.
 *
 * Usage:
 *   const { status, triggerSave } = useAutoSave({
 *     delay: 2000,
 *     onSave: async (content) => {
 *       await updateNoteContentAction({ ..., content });
 *     },
 *   });
 *
 *   // Call triggerSave in the editor's onUpdate callback:
 *   triggerSave(json);
 */
export function useAutoSave({ delay = 2000, onSave }: UseAutoSaveOptions) {
	const [status, setStatus] = useState<SaveStatus>("idle");
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const idleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const latestValueRef = useRef<string>("");

	const triggerSave = useCallback(
		(value: string) => {
			latestValueRef.current = value;

			// Clear any pending save
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);

			// Schedule save after delay
			timeoutRef.current = setTimeout(async () => {
				try {
					setStatus("saving");
					await onSave(latestValueRef.current);
					setStatus("saved");
					// Return to idle after 2 seconds
					idleTimeoutRef.current = setTimeout(() => setStatus("idle"), 2000);
				} catch {
					setStatus("error");
				}
			}, delay);
		},
		[delay, onSave],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
			if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
		};
	}, []);

	return { status, triggerSave };
}
