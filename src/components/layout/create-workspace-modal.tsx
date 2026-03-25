"use client";

import { createWorkspaceAction } from "@/actions/workspaces";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

interface CreateWorkspaceModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: CreateWorkspaceModalProps) {
	const router = useRouter();
	const [state, formAction, isPending] = useActionState(createWorkspaceAction, null);

	// Navigate on success
	useEffect(() => {
		if (state?.success && state.workspaceId) {
			onClose();
			router.push(`/${state.workspaceId}`);
		}
	}, [state?.success, state?.workspaceId, onClose, router]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, onClose]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0"
						style={{ backgroundColor: "var(--color-overlay-scrim)", zIndex: 300 }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
					/>

					{/* Modal */}
					<div
						className="fixed inset-0 flex items-center justify-center px-4"
						style={{ zIndex: 301, pointerEvents: "none" }}
					>
						<motion.div
							className="w-full"
							style={{
								maxWidth: 440,
								backgroundColor: "var(--color-bg-surface)",
								border: "1px solid var(--color-border-default)",
								borderRadius: "var(--radius-xl, 16px)",
								boxShadow: "var(--shadow-modal)",
								pointerEvents: "auto",
							}}
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							transition={{ type: "spring", stiffness: 400, damping: 30 }}
						>
							{/* Header */}
							<div
								className="flex items-start justify-between p-6"
								style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
							>
								<div>
									<h2
										className="text-xl font-semibold"
										style={{
											fontFamily: "var(--font-display)",
											color: "var(--color-text-primary)",
										}}
									>
										Create a new workspace
									</h2>
									<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Workspaces keep your team's research separate.
									</p>
								</div>
								<button
									type="button"
									onClick={onClose}
									className="rounded-md p-1 transition-opacity hover:opacity-70"
									style={{ color: "var(--color-text-muted)" }}
									aria-label="Close"
								>
									<X size={18} />
								</button>
							</div>

							{/* Form */}
							<form action={formAction} className="p-6 space-y-5">
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

								{/* Name */}
								<div>
									<label
										htmlFor="ws-name"
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
										id="ws-name"
										name="name"
										type="text"
										required
										maxLength={100}
										placeholder="Acme Research"
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
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
										htmlFor="ws-logo"
										className="block text-xs font-medium mb-1.5"
										style={{
											fontFamily: "var(--font-mono)",
											color: "var(--color-text-muted)",
											letterSpacing: "var(--tracking-wide)",
										}}
									>
										LOGO URL{" "}
										<span
											style={{
												fontFamily: "var(--font-sans)",
												opacity: 0.5,
												fontWeight: 400,
											}}
										>
											— optional
										</span>
									</label>
									<input
										id="ws-logo"
										name="logoUrl"
										type="url"
										placeholder="https://..."
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
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

								{/* Actions */}
								<div className="flex gap-3 pt-1">
									<button
										type="button"
										onClick={onClose}
										disabled={isPending}
										className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-opacity hover:opacity-70"
										style={{
											color: "var(--color-text-muted)",
											border: "1px solid var(--color-border-default)",
											backgroundColor: "transparent",
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={isPending}
										className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
										style={{
											background: "var(--gradient-gold)",
											color: "var(--color-text-inverse)",
											opacity: isPending ? 0.7 : 1,
										}}
									>
										{isPending ? "Creating…" : "Create Workspace"}
									</button>
								</div>
							</form>
						</motion.div>
					</div>
				</>
			)}
		</AnimatePresence>
	);
}
