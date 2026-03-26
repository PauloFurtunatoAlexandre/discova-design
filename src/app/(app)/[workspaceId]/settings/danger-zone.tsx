"use client";

import { deleteWorkspaceAction } from "@/actions/workspaces";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface DangerZoneProps {
	workspaceId: string;
	workspaceName: string;
}

export function DangerZone({ workspaceId, workspaceName }: DangerZoneProps) {
	const router = useRouter();
	const [confirmText, setConfirmText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const canDelete = confirmText === workspaceName;

	function handleDelete() {
		if (!canDelete) return;
		setError(null);
		startTransition(async () => {
			const result = await deleteWorkspaceAction(workspaceId);
			if (result.error) {
				setError(result.error);
			} else {
				router.push("/");
			}
		});
	}

	return (
		<section>
			<h2
				className="text-lg mb-4"
				style={{
					fontFamily: "var(--font-display)",
					color: "var(--color-status-error, #e07356)",
				}}
			>
				Danger Zone
			</h2>

			<div
				className="rounded-xl p-6 space-y-5"
				style={{
					border:
						"1px solid color-mix(in srgb, var(--color-status-error, #e07356) 25%, transparent)",
					backgroundColor: "color-mix(in srgb, var(--color-status-error, #e07356) 4%, transparent)",
				}}
			>
				<div>
					<h3 className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>
						Delete &ldquo;{workspaceName}&rdquo;
					</h3>
					<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
						This will remove all members and make this workspace inaccessible. Your data will be
						preserved but you won&rsquo;t be able to access it.
					</p>
				</div>

				{error && (
					<div
						className="rounded-lg px-4 py-3 text-sm"
						style={{
							backgroundColor: "var(--color-status-error-bg)",
							color: "var(--color-status-error)",
							border: "1px solid var(--color-accent-coral-muted)",
						}}
					>
						{error}
					</div>
				)}

				{/* Confirmation input */}
				<div>
					<label
						htmlFor="delete-confirm"
						className="block text-xs font-medium mb-1.5"
						style={{
							fontFamily: "var(--font-mono)",
							color: "var(--color-text-muted)",
							letterSpacing: "var(--tracking-wide)",
						}}
					>
						TYPE &ldquo;{workspaceName}&rdquo; TO CONFIRM
					</label>
					<input
						id="delete-confirm"
						type="text"
						value={confirmText}
						onChange={(e) => setConfirmText(e.target.value)}
						placeholder={workspaceName}
						className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
						style={{
							backgroundColor: "var(--color-bg-sunken)",
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-primary)",
						}}
					/>
				</div>

				<button
					type="button"
					onClick={handleDelete}
					disabled={!canDelete || isPending}
					className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
					style={{
						backgroundColor:
							canDelete && !isPending ? "var(--color-status-error, #e07356)" : "transparent",
						color: canDelete && !isPending ? "#fff" : "var(--color-text-muted)",
						border: `1px solid ${canDelete && !isPending ? "transparent" : "var(--color-border-default)"}`,
						cursor: !canDelete || isPending ? "not-allowed" : "pointer",
						opacity: isPending ? 0.7 : 1,
					}}
				>
					{isPending ? "Deleting…" : `Delete ${workspaceName}`}
				</button>
			</div>
		</section>
	);
}
