"use client";

import { createProblemAndLinkAction } from "@/actions/insights";
import { useState } from "react";

interface CreateProblemInlineProps {
	projectId: string;
	workspaceId: string;
	insightId: string;
	onCreated: (problemNodeId: string, problemLabel: string) => void;
	onCancel: () => void;
}

export function CreateProblemInline({
	projectId,
	workspaceId,
	insightId,
	onCreated,
	onCancel,
}: CreateProblemInlineProps) {
	const [label, setLabel] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!label.trim()) return;

		setIsSubmitting(true);
		setError(null);

		const result = await createProblemAndLinkAction({
			workspaceId,
			projectId,
			insightId,
			problemLabel: label.trim(),
			problemDescription: description.trim() || null,
		});

		setIsSubmitting(false);

		if ("error" in result) {
			setError(result.error);
			return;
		}

		onCreated(result.problemNodeId, label.trim());
	}

	return (
		<form onSubmit={handleSubmit} className="mt-3">
			<div className="mb-2">
				<label
					htmlFor="problem-label"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.65rem",
						color: "var(--color-text-muted)",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						display: "block",
						marginBottom: "4px",
					}}
				>
					Problem statement
				</label>
				<input
					id="problem-label"
					type="text"
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					placeholder="e.g., Users struggle to complete onboarding"
					maxLength={300}
					// biome-ignore lint/a11y/noAutofocus: user clicked "Create new problem" — focus is intentional
					autoFocus
					className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-1"
					style={{
						fontFamily: "var(--font-body)",
						background: "var(--color-bg-sunken)",
						border: "1px solid var(--color-border-subtle)",
						color: "var(--color-text-primary)",
					}}
					disabled={isSubmitting}
				/>
			</div>

			<div className="mb-3">
				<label
					htmlFor="problem-description"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "0.65rem",
						color: "var(--color-text-muted)",
						textTransform: "uppercase",
						letterSpacing: "0.08em",
						display: "block",
						marginBottom: "4px",
					}}
				>
					Description (optional)
				</label>
				<textarea
					id="problem-description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					placeholder="Add context..."
					rows={2}
					maxLength={1000}
					className="w-full resize-none rounded-md px-3 py-2 text-sm outline-none focus:ring-1"
					style={{
						fontFamily: "var(--font-body)",
						background: "var(--color-bg-sunken)",
						border: "1px solid var(--color-border-subtle)",
						color: "var(--color-text-primary)",
					}}
					disabled={isSubmitting}
				/>
			</div>

			{error && (
				<p
					className="mb-2 text-xs"
					style={{ color: "var(--color-status-error)", fontFamily: "var(--font-body)" }}
				>
					{error}
				</p>
			)}

			<div className="flex items-center gap-2">
				<button
					type="submit"
					disabled={isSubmitting || !label.trim()}
					className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-coral]"
					style={{
						fontFamily: "var(--font-body)",
						background: "var(--color-accent-coral)",
						color: "var(--color-text-inverse)",
					}}
				>
					{isSubmitting ? "Creating…" : "Create & Link"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					disabled={isSubmitting}
					className="text-xs transition-colors duration-150 hover:underline disabled:opacity-50 focus-visible:outline-none"
					style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}
