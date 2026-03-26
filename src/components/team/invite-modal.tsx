"use client";

import { inviteMemberAction } from "@/actions/team";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

interface InviteModalProps {
	isOpen: boolean;
	onClose: () => void;
	workspaceId: string;
}

export function InviteModal({ isOpen, onClose, workspaceId }: InviteModalProps) {
	const [email, setEmail] = useState("");
	const [tier, setTier] = useState<"member" | "viewer">("member");
	const [preset, setPreset] = useState<"researcher" | "pm" | "member" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	// Auto-focus email input
	useEffect(() => {
		if (isOpen) {
			setTimeout(() => inputRef.current?.focus(), 100);
		}
	}, [isOpen]);

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [isOpen, onClose]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		startTransition(async () => {
			const result = await inviteMemberAction({
				workspaceId,
				email,
				tier,
				workspacePreset: preset,
			});
			if ("error" in result) {
				setError(result.error);
			} else {
				setEmail("");
				setTier("member");
				setPreset(null);
				onClose();
			}
		});
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					<motion.div
						className="fixed inset-0"
						style={{ backgroundColor: "var(--color-overlay-scrim)", zIndex: 300 }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						onClick={onClose}
					/>

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
										Invite team member
									</h2>
									<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
										They must already have a Discova account.
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
							<form onSubmit={handleSubmit} className="p-6 space-y-5">
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

								{/* Email */}
								<div>
									<label
										htmlFor="invite-email"
										className="block text-xs font-medium mb-1.5"
										style={{
											fontFamily: "var(--font-mono)",
											color: "var(--color-text-muted)",
											letterSpacing: "var(--tracking-wide)",
										}}
									>
										EMAIL ADDRESS
									</label>
									<input
										ref={inputRef}
										id="invite-email"
										type="email"
										required
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="colleague@company.com"
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
										style={{
											backgroundColor: "var(--color-bg-sunken)",
											border: "1px solid var(--color-border-default)",
											color: "var(--color-text-primary)",
										}}
									/>
								</div>

								{/* Tier + Preset row */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label
											htmlFor="invite-tier"
											className="block text-xs font-medium mb-1.5"
											style={{
												fontFamily: "var(--font-mono)",
												color: "var(--color-text-muted)",
												letterSpacing: "var(--tracking-wide)",
											}}
										>
											ROLE
										</label>
										<select
											id="invite-tier"
											value={tier}
											onChange={(e) => setTier(e.target.value as "member" | "viewer")}
											className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
											style={{
												backgroundColor: "var(--color-bg-sunken)",
												border: "1px solid var(--color-border-default)",
												color: "var(--color-text-primary)",
											}}
										>
											<option value="member">Member</option>
											<option value="viewer">Viewer</option>
										</select>
									</div>

									<div>
										<label
											htmlFor="invite-preset"
											className="block text-xs font-medium mb-1.5"
											style={{
												fontFamily: "var(--font-mono)",
												color: "var(--color-text-muted)",
												letterSpacing: "var(--tracking-wide)",
											}}
										>
											PRESET
										</label>
										<select
											id="invite-preset"
											value={preset ?? ""}
											onChange={(e) => {
												const v = e.target.value;
												setPreset(v === "" ? null : (v as "researcher" | "pm" | "member"));
											}}
											className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
											style={{
												backgroundColor: "var(--color-bg-sunken)",
												border: "1px solid var(--color-border-default)",
												color: "var(--color-text-primary)",
											}}
										>
											<option value="">None</option>
											<option value="researcher">Researcher</option>
											<option value="pm">PM</option>
											<option value="member">Member</option>
										</select>
									</div>
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
											background: "var(--color-accent-purple)",
											color: "var(--color-text-inverse)",
											opacity: isPending ? 0.7 : 1,
										}}
									>
										{isPending ? "Sending invite…" : "Send Invite"}
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
