"use client";

import type { AISuggestion, AnalysisState } from "@/lib/engine/types";
import { nanoid } from "nanoid";
import { useCallback, useRef, useState } from "react";

/**
 * Hook for managing AI analysis of a research note.
 *
 * Handles triggering the analysis, managing the reading-animation phases,
 * reading the streamed response, and error / rate-limit states.
 *
 * Uses a manual fetch + ReadableStream because ai/react (useCompletion) is not
 * available in Vercel AI SDK v6.
 */
export function useAnalysis(params: {
	noteId: string;
	workspaceId: string;
	projectId: string;
	totalParagraphs: number;
}) {
	const { noteId, workspaceId, projectId, totalParagraphs } = params;
	const [state, setState] = useState<AnalysisState>({ status: "idle" });
	const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const animationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

	function stopReadingAnimation() {
		if (animationTimerRef.current) {
			clearInterval(animationTimerRef.current);
			animationTimerRef.current = null;
		}
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: stopReadingAnimation closes over a stable ref — stale closure is safe
	const startAnalysis = useCallback(async () => {
		setSuggestions([]);
		setIsLoading(true);

		// Kick off the fake paragraph-reading animation
		let currentParagraph = 0;
		setState({ status: "reading", currentParagraph: 0, totalParagraphs });
		animationTimerRef.current = setInterval(() => {
			currentParagraph += 1;
			if (currentParagraph >= totalParagraphs) {
				stopReadingAnimation();
				setState({ status: "analysing", statusText: "Generating insights..." });
			} else {
				setState({ status: "reading", currentParagraph, totalParagraphs });
			}
		}, 2500);

		try {
			const response = await fetch("/api/engine/analyse", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ noteId, workspaceId, projectId }),
			});

			if (!response.ok) {
				stopReadingAnimation();
				const data = (await response.json()) as {
					error?: string;
					retryAfterSeconds?: number;
					message?: string;
				};
				if (data.error === "rate_limited") {
					setState({
						status: "rate_limited",
						retryAfterSeconds: data.retryAfterSeconds ?? 60,
					});
				} else {
					setState({
						status: "error",
						message: data.message ?? "Analysis failed. Please try again.",
						canRetry: true,
					});
				}
				return;
			}

			// Got the response — switch animation to "analysing"
			stopReadingAnimation();
			setState({ status: "analysing", statusText: "Finding patterns..." });

			// Accumulate the full text stream
			const reader = response.body?.getReader();
			if (!reader) throw new Error("No response body");

			const decoder = new TextDecoder();
			let text = "";
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				text += decoder.decode(value, { stream: true });
			}

			// Parse the complete JSON array from the AI
			const raw = JSON.parse(text) as Array<Omit<AISuggestion, "id">>;
			const withIds: AISuggestion[] = raw.map((s) => ({ ...s, id: nanoid() }));
			setSuggestions(withIds);
			setState({ status: "complete", suggestions: withIds });
		} catch {
			stopReadingAnimation();
			setState({
				status: "error",
				message: "Analysis failed. Please check your connection and try again.",
				canRetry: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [noteId, workspaceId, projectId, totalParagraphs]);

	const retry = useCallback(() => {
		startAnalysis();
	}, [startAnalysis]);

	const dismissSuggestion = useCallback((suggestionId: string) => {
		setSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
	}, []);

	return {
		state,
		suggestions,
		startAnalysis,
		retry,
		dismissSuggestion,
		isLoading,
	};
}
