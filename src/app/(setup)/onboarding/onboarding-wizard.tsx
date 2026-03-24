"use client";

import {
	createOnboardingProjectAction,
	updateWorkspaceNameAction,
} from "@/actions/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Briefcase, Check, FolderOpen } from "lucide-react";
import { useState } from "react";

interface OnboardingWizardProps {
	workspace: { id: string; name: string };
	userName: string;
}

const STEPS = ["workspace", "project", "done"] as const;
type Step = (typeof STEPS)[number];

const variants = {
	enter: { opacity: 0, x: 32 },
	center: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -32 },
};

export function OnboardingWizard({ workspace, userName }: OnboardingWizardProps) {
	const [step, setStep] = useState<Step>("workspace");
	const [workspaceName, setWorkspaceName] = useState(workspace.name);
	const [projectName, setProjectName] = useState("");
	const [projectDescription, setProjectDescription] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

	const firstName = userName.split(" ")[0] || "there";
	const stepIndex = STEPS.indexOf(step);

	async function handleWorkspaceSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!workspaceName.trim()) return;
		setError(null);
		setIsSubmitting(true);
		const result = await updateWorkspaceNameAction(workspace.id, workspaceName);
		setIsSubmitting(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setStep("project");
	}

	async function handleProjectSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!projectName.trim()) return;
		setError(null);
		setIsSubmitting(true);
		const result = await createOnboardingProjectAction(
			workspace.id,
			projectName,
			projectDescription,
		);
		setIsSubmitting(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		setCreatedProjectId(result.projectId ?? null);
		setStep("done");
	}

	function handleSkipProject() {
		setStep("done");
	}

	function handleFinish() {
		window.location.href = `/${workspace.id}`;
	}

	return (
		<div className="w-full max-w-lg">
			{/* Logo */}
			<div className="text-center mb-8">
				<img
					src="/discova-lockup-dark.svg"
					alt="Discova"
					className="logo-dark"
					style={{ height: "32px", width: "auto", display: "inline-block" }}
				/>
				<img
					src="/discova-lockup-light.svg"
					alt="Discova"
					className="logo-light"
					style={{ height: "32px", width: "auto", display: "none" }}
				/>
			</div>

			{/* Step indicator */}
			<div className="flex items-center justify-center gap-2 mb-8">
				{[0, 1, 2].map((i) => (
					<div
						key={i}
						style={{
							width: i === stepIndex ? 24 : 8,
							height: 8,
							borderRadius: 4,
							backgroundColor:
								i < stepIndex
									? "var(--color-accent-gold)"
									: i === stepIndex
										? "var(--color-accent-gold)"
										: "var(--color-border-default)",
							opacity: i < stepIndex ? 0.5 : 1,
							transition: "width 0.3s ease, background-color 0.3s ease",
						}}
					/>
				))}
			</div>

			{/* Card */}
			<div
				className="rounded-2xl overflow-hidden"
				style={{
					backgroundColor: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-default)",
					boxShadow: "var(--shadow-modal)",
				}}
			>
				<AnimatePresence mode="wait">
					{step === "workspace" && (
						<motion.div
							key="workspace"
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<form onSubmit={handleWorkspaceSubmit} className="p-8 space-y-6">
								{/* Icon */}
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl"
									style={{ backgroundColor: "var(--color-accent-gold-muted)" }}
								>
									<Briefcase size={22} style={{ color: "var(--color-accent-gold)" }} />
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
									>
										Welcome, {firstName}!
									</h1>
									<p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Let's start by naming your workspace. You can change this anytime.
									</p>
								</div>

								<div>
									<label
										htmlFor="workspace-name"
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
										id="workspace-name"
										type="text"
										value={workspaceName}
										onChange={(e) => setWorkspaceName(e.target.value)}
										required
										maxLength={64}
										autoFocus
										className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
										style={{
											backgroundColor: "var(--color-bg-sunken)",
											border: "1px solid var(--color-border-default)",
											color: "var(--color-text-primary)",
										}}
										placeholder="Acme Corp"
									/>
								</div>

								{error && (
									<p className="text-sm" style={{ color: "var(--color-status-error)" }}>
										{error}
									</p>
								)}

								<button
									type="submit"
									disabled={isSubmitting || !workspaceName.trim()}
									className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
									style={{
										background: "var(--gradient-gold)",
										color: "var(--color-text-inverse)",
										opacity: isSubmitting || !workspaceName.trim() ? 0.6 : 1,
									}}
								>
									{isSubmitting ? "Saving…" : "Continue"}
									{!isSubmitting && <ArrowRight size={15} />}
								</button>
							</form>
						</motion.div>
					)}

					{step === "project" && (
						<motion.div
							key="project"
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<form onSubmit={handleProjectSubmit} className="p-8 space-y-6">
								{/* Icon */}
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl"
									style={{ backgroundColor: "var(--color-accent-blue-muted, color-mix(in srgb, var(--color-accent-blue) 12%, transparent))" }}
								>
									<FolderOpen size={22} style={{ color: "var(--color-accent-blue)" }} />
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
									>
										Create your first project
									</h1>
									<p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Projects are where you store research, generate insights, and build your product roadmap.
									</p>
								</div>

								<div className="space-y-4">
									<div>
										<label
											htmlFor="project-name"
											className="block text-xs font-medium mb-1.5"
											style={{
												fontFamily: "var(--font-mono)",
												color: "var(--color-text-muted)",
												letterSpacing: "var(--tracking-wide)",
											}}
										>
											PROJECT NAME
										</label>
										<input
											id="project-name"
											type="text"
											value={projectName}
											onChange={(e) => setProjectName(e.target.value)}
											maxLength={100}
											autoFocus
											className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors"
											style={{
												backgroundColor: "var(--color-bg-sunken)",
												border: "1px solid var(--color-border-default)",
												color: "var(--color-text-primary)",
											}}
											placeholder="e.g. Mobile App Redesign"
										/>
									</div>

									<div>
										<label
											htmlFor="project-desc"
											className="block text-xs font-medium mb-1.5"
											style={{
												fontFamily: "var(--font-mono)",
												color: "var(--color-text-muted)",
												letterSpacing: "var(--tracking-wide)",
											}}
										>
											DESCRIPTION{" "}
											<span style={{ opacity: 0.5, fontFamily: "var(--font-sans)" }}>
												— optional
											</span>
										</label>
										<textarea
											id="project-desc"
											value={projectDescription}
											onChange={(e) => setProjectDescription(e.target.value)}
											maxLength={500}
											rows={3}
											className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-colors resize-none"
											style={{
												backgroundColor: "var(--color-bg-sunken)",
												border: "1px solid var(--color-border-default)",
												color: "var(--color-text-primary)",
											}}
											placeholder="What are you trying to learn or build?"
										/>
									</div>
								</div>

								{error && (
									<p className="text-sm" style={{ color: "var(--color-status-error)" }}>
										{error}
									</p>
								)}

								<div className="flex flex-col gap-2">
									<button
										type="submit"
										disabled={isSubmitting || !projectName.trim()}
										className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
										style={{
											background: "var(--gradient-gold)",
											color: "var(--color-text-inverse)",
											opacity: isSubmitting || !projectName.trim() ? 0.6 : 1,
										}}
									>
										{isSubmitting ? "Creating…" : "Create project"}
										{!isSubmitting && <ArrowRight size={15} />}
									</button>
									<button
										type="button"
										onClick={handleSkipProject}
										className="w-full py-2 text-sm transition-opacity hover:opacity-80"
										style={{ color: "var(--color-text-muted)" }}
									>
										Skip for now
									</button>
								</div>
							</form>
						</motion.div>
					)}

					{step === "done" && (
						<motion.div
							key="done"
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<div className="p-8 space-y-6 text-center">
								{/* Check icon */}
								<div className="flex justify-center">
									<div
										className="flex h-14 w-14 items-center justify-center rounded-full"
										style={{ backgroundColor: "var(--color-status-success-bg, color-mix(in srgb, var(--color-accent-green) 12%, transparent))" }}
									>
										<Check size={26} style={{ color: "var(--color-accent-green)" }} />
									</div>
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
									>
										You're all set!
									</h1>
									<p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Your workspace is ready.
										{createdProjectId
											? " Your first project is waiting for research."
											: " You can create a project anytime from the sidebar."}
									</p>
								</div>

								{/* Summary */}
								<div
									className="rounded-lg p-4 text-left space-y-2"
									style={{
										backgroundColor: "var(--color-bg-raised)",
										border: "1px solid var(--color-border-subtle)",
									}}
								>
									<div className="flex items-center gap-2 text-sm">
										<Check size={13} style={{ color: "var(--color-accent-gold)", flexShrink: 0 }} />
										<span style={{ color: "var(--color-text-secondary)" }}>
											Workspace:{" "}
											<span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
												{workspaceName}
											</span>
										</span>
									</div>
									{createdProjectId && (
										<div className="flex items-center gap-2 text-sm">
											<Check size={13} style={{ color: "var(--color-accent-gold)", flexShrink: 0 }} />
											<span style={{ color: "var(--color-text-secondary)" }}>
												Project:{" "}
												<span style={{ color: "var(--color-text-primary)", fontWeight: 500 }}>
													{projectName}
												</span>
											</span>
										</div>
									)}
								</div>

								<button
									type="button"
									onClick={handleFinish}
									className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
									style={{
										background: "var(--gradient-gold)",
										color: "var(--color-text-inverse)",
									}}
								>
									Open Discova
									<ArrowRight size={15} />
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Step label */}
			<p className="text-center mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
				Step {stepIndex + 1} of {STEPS.length}
			</p>
		</div>
	);
}
