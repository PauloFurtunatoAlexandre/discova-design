"use client";

import { createProjectAction } from "@/actions/projects";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";

interface CreateProjectModalProps {
	workspaceId: string;
	isOpen: boolean;
	onClose: () => void;
}

const DEFAULT_NAME = "My First Discovery";

export function CreateProjectModal({ workspaceId, isOpen, onClose }: CreateProjectModalProps) {
	const router = useRouter();
	const boundAction = createProjectAction.bind(null, workspaceId);
	const [state, formAction, isPending] = useActionState(boundAction, null);

	const [name, setName] = useState(DEFAULT_NAME);
	const [hasEditedName, setHasEditedName] = useState(false);
	const [description, setDescription] = useState("");

	// Reset fields each time modal opens
	useEffect(() => {
		if (isOpen) {
			setName(DEFAULT_NAME);
			setHasEditedName(false);
			setDescription("");
		}
	}, [isOpen]);

	// Navigate on success
	useEffect(() => {
		if (state?.success && state.projectId) {
			onClose();
			router.push(`/${workspaceId}/${state.projectId}/vault`);
		}
	}, [state?.success, state?.projectId, onClose, router, workspaceId]);

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
								maxWidth: 480,
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
										Create a new project
									</h2>
									<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Projects are persistent product areas — not sprints. Research accumulates here
										over time.
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
										{state.error}
									</div>
								)}

								{/* Name */}
								<div>
									<label
										htmlFor="proj-name"
										className="block text-xs font-medium mb-1.5 uppercase"
										style={{
											fontFamily: "var(--font-mono)",
											color: "var(--color-text-muted)",
											letterSpacing: "var(--tracking-wide)",
										}}
									>
										Project Name
									</label>
									<input
										id="proj-name"
										name="name"
										type="text"
										required
										maxLength={200}
										value={name}
										onChange={(e) => {
											setHasEditedName(true);
											setName(e.target.value);
										}}
										onFocus={() => {
											if (!hasEditedName) {
												setName("");
												setHasEditedName(true);
											}
										}}
										placeholder="e.g., Mobile App, Checkout Flow, Onboarding"
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
										style={{
											backgroundColor: "var(--color-bg-sunken)",
											border: "1px solid var(--color-border-default)",
											color: "var(--color-text-primary)",
										}}
									/>
									{state?.fieldErrors?.name && (
										<p className="mt-1 text-xs" style={{ color: "var(--color-status-error)" }}>
											{state.fieldErrors.name[0]}
										</p>
									)}
								</div>

								{/* Description */}
								<div>
									<label
										htmlFor="proj-description"
										className="block text-xs font-medium mb-1.5 uppercase"
										style={{
											fontFamily: "var(--font-mono)",
											color: "var(--color-text-muted)",
											letterSpacing: "var(--tracking-wide)",
										}}
									>
										Description{" "}
										<span
											style={{
												fontFamily: "var(--font-sans)",
												opacity: 0.5,
												fontWeight: 400,
												textTransform: "none",
											}}
										>
											— optional
										</span>
									</label>
									<textarea
										id="proj-description"
										name="description"
										rows={3}
										maxLength={1000}
										value={description}
										onChange={(e) => setDescription(e.target.value)}
										placeholder="What product area does this project cover?"
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors resize-none focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
										style={{
											backgroundColor: "var(--color-bg-sunken)",
											border: "1px solid var(--color-border-default)",
											color: "var(--color-text-primary)",
										}}
									/>
									<p
										className="mt-1 text-xs text-right"
										style={{ color: "var(--color-text-muted)" }}
									>
										{description.length} / 1000
									</p>
									{state?.fieldErrors?.description && (
										<p className="mt-1 text-xs" style={{ color: "var(--color-status-error)" }}>
											{state.fieldErrors.description[0]}
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
										{isPending ? "Creating…" : "Create Project"}
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
