"use client";

import { createMapNodeAction } from "@/actions/map";
import type { NodeType } from "@/lib/map/types";
import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

interface CreateNodeSlideoverProps {
	isOpen: boolean;
	onClose: () => void;
	nodeType: "problem" | "solution";
	workspaceId: string;
	projectId: string;
}

const TYPE_CONFIG: Record<
	"problem" | "solution",
	{ title: string; placeholder: string; accent: string }
> = {
	problem: {
		title: "New Problem",
		placeholder: "What user problem have you identified?",
		accent: "var(--color-accent-coral)",
	},
	solution: {
		title: "New Solution",
		placeholder: "What solution addresses this problem?",
		accent: "var(--color-accent-green)",
	},
};

export function CreateNodeSlideover({
	isOpen,
	onClose,
	nodeType,
	workspaceId,
	projectId,
}: CreateNodeSlideoverProps) {
	const [label, setLabel] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);
	const config = TYPE_CONFIG[nodeType];

	useEffect(() => {
		if (isOpen) {
			inputRef.current?.focus();
		}
	}, [isOpen]);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			setError(null);

			startTransition(async () => {
				const result = await createMapNodeAction({
					workspaceId,
					projectId,
					type: nodeType,
					label: label.trim(),
					description: description.trim() || null,
				});

				if ("error" in result) {
					setError(result.error);
					return;
				}

				setLabel("");
				setDescription("");
				onClose();
			});
		},
		[workspaceId, projectId, nodeType, label, description, onClose],
	);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-y-0 right-0 z-40 flex" style={{ width: 400 }}>
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 z-[-1]"
				style={{ backgroundColor: "var(--color-overlay-scrim)" }}
				onClick={onClose}
				aria-label="Close panel"
			/>

			{/* Panel */}
			<div
				className="flex h-full w-full flex-col"
				style={{
					backgroundColor: "var(--color-bg-surface)",
					borderLeft: "1px solid var(--color-border-default)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				{/* Header */}
				<div
					className="flex items-center justify-between px-6 py-4"
					style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
				>
					<div className="flex items-center gap-3">
						<span
							className="rounded-full"
							style={{
								width: 10,
								height: 10,
								backgroundColor: config.accent,
							}}
						/>
						<h2
							style={{
								fontFamily: "var(--font-display)",
								fontSize: "var(--text-lg)",
								fontWeight: 500,
								color: "var(--color-text-primary)",
							}}
						>
							{config.title}
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="flex items-center justify-center rounded-md transition-colors"
						style={{
							width: 32,
							height: 32,
							color: "var(--color-text-muted)",
						}}
					>
						<X size={18} />
					</button>
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 p-6">
					{/* Label */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="node-label"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Statement
						</label>
						<input
							ref={inputRef}
							id="node-label"
							type="text"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							placeholder={config.placeholder}
							maxLength={300}
							required
							className="rounded-md px-3 py-2.5 transition-colors focus-visible:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-primary)",
								backgroundColor: "var(--color-bg-raised)",
								border: "1px solid var(--color-border-subtle)",
							}}
						/>
						<span
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "10px",
								color: "var(--color-text-muted)",
								textAlign: "right",
							}}
						>
							{label.length}/300
						</span>
					</div>

					{/* Description */}
					<div className="flex flex-col gap-1.5">
						<label
							htmlFor="node-description"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "var(--text-xs)",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.05em",
							}}
						>
							Description (optional)
						</label>
						<textarea
							id="node-description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Add context or details..."
							maxLength={1000}
							rows={4}
							className="resize-none rounded-md px-3 py-2.5 transition-colors focus-visible:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-primary)",
								backgroundColor: "var(--color-bg-raised)",
								border: "1px solid var(--color-border-subtle)",
							}}
						/>
					</div>

					{/* Error */}
					{error && (
						<p
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-xs)",
								color: "var(--color-status-error)",
							}}
						>
							{error}
						</p>
					)}

					{/* Spacer */}
					<div className="flex-1" />

					{/* Actions */}
					<div className="flex gap-3">
						<button
							type="button"
							onClick={onClose}
							className="flex-1 rounded-lg px-4 py-2.5 transition-colors"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								fontWeight: 500,
								color: "var(--color-text-secondary)",
								backgroundColor: "var(--color-bg-raised)",
								border: "1px solid var(--color-border-subtle)",
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={isPending || label.trim().length === 0}
							className="flex-1 rounded-lg px-4 py-2.5 transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								fontWeight: 600,
								color: "var(--color-text-inverse)",
								backgroundColor: config.accent,
							}}
						>
							{isPending ? "Creating..." : "Create"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
