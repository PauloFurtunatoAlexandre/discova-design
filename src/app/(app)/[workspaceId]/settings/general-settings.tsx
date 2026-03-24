"use client";

import { updateWorkspaceAction } from "@/actions/workspaces";
import { Check } from "lucide-react";
import { useActionState } from "react";

interface GeneralSettingsProps {
	workspaceId: string;
	currentName: string;
	currentLogoUrl: string | null;
}

export function GeneralSettings({
	workspaceId,
	currentName,
	currentLogoUrl,
}: GeneralSettingsProps) {
	const boundAction = updateWorkspaceAction.bind(null, workspaceId);
	const [state, formAction, isPending] = useActionState(boundAction, null);
	return (
		<section>
			<h2
				className="text-lg mb-4"
				style={{
					fontFamily: "var(--font-display)",
					color: "var(--color-text-primary)",
				}}
			>
				General
			</h2>

			<form action={formAction} className="space-y-5">
				{state?.error && (
					<div
						className="rounded-lg px-4 py-3 text-sm"
						style={{
							backgroundColor: "var(--color-status-error-bg)",
							color: "var(--color-status-error)",
							border: "1px solid var(--color-accent-coral-muted)",
						}}
					>
						{state?.error}
					</div>
				)}

				{/* Workspace Name */}
				<div>
					<label
						htmlFor="settings-name"
						className="block text-xs font-medium mb-1.5"
						style={{
							fontFamily: "var(--font-mono)",
							color: "var(--color-text-muted)",
							letterSpacing: "var(--tracking-wide)",
						}}
					>
						WORKSPACE NAME
					</label>
					<input
						id="settings-name"
						name="name"
						type="text"
						defaultValue={currentName}
						required
						maxLength={100}
						className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
						style={{
							backgroundColor: "var(--color-bg-sunken)",
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-primary)",
						}}
					/>
					{state?.fieldErrors?.name && (
						<p className="mt-1 text-xs" style={{ color: "var(--color-status-error)" }}>
							{state?.fieldErrors.name[0]}
						</p>
					)}
				</div>

				{/* Logo URL */}
				<div>
					<label
						htmlFor="settings-logo"
						className="block text-xs font-medium mb-1.5"
						style={{
							fontFamily: "var(--font-mono)",
							color: "var(--color-text-muted)",
							letterSpacing: "var(--tracking-wide)",
						}}
					>
						LOGO URL{" "}
						<span style={{ fontFamily: "var(--font-sans)", opacity: 0.5, fontWeight: 400 }}>
							— optional
						</span>
					</label>
					<input
						id="settings-logo"
						name="logoUrl"
						type="url"
						defaultValue={currentLogoUrl ?? ""}
						placeholder="https://..."
						className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
						style={{
							backgroundColor: "var(--color-bg-sunken)",
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-primary)",
						}}
					/>
					<p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
						Paste a URL to your workspace logo. File upload coming soon.
					</p>
					{state?.fieldErrors?.logoUrl && (
						<p className="mt-1 text-xs" style={{ color: "var(--color-status-error)" }}>
							{state?.fieldErrors.logoUrl[0]}
						</p>
					)}
				</div>

				{/* Save button + success indicator */}
				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={isPending}
						className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
						style={{
							background: "var(--gradient-gold)",
							color: "var(--color-text-inverse)",
							opacity: isPending ? 0.7 : 1,
						}}
					>
						{isPending ? "Saving…" : "Save changes"}
					</button>

					{state?.success && (
						<span
							className="flex items-center gap-1.5 text-sm"
							style={{ color: "var(--color-status-success, var(--color-accent-green))" }}
						>
							<Check size={14} />
							Saved
						</span>
					)}
				</div>
			</form>
		</section>
	);
}
