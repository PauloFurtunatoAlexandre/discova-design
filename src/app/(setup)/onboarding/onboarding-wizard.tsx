"use client";

import {
	createOnboardingProjectAction,
	seedDemoWorkspaceAction,
	setOnboardingRoleAction,
	updateWorkspaceNameAction,
} from "@/actions/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import {
	ArrowRight,
	BarChart3,
	BookOpen,
	Briefcase,
	Check,
	FolderOpen,
	GitBranch,
	Sparkles,
	UserCircle,
	Users,
} from "lucide-react";
import { useState } from "react";

interface OnboardingWizardProps {
	workspace: { id: string; name: string };
	userName: string;
}

const STEPS = ["workspace", "role", "project", "done"] as const;
type Step = (typeof STEPS)[number];

const ROLES = [
	{
		value: "researcher",
		label: "Researcher",
		description: "I run interviews, surveys, and usability tests",
		icon: BookOpen,
	},
	{
		value: "pm",
		label: "Product Manager",
		description: "I prioritise features and drive the roadmap",
		icon: BarChart3,
	},
	{
		value: "member",
		label: "Team Member",
		description: "I contribute to product decisions across roles",
		icon: Users,
	},
] as const;

const variants = {
	enter: { opacity: 0, x: 32 },
	center: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -32 },
};

export function OnboardingWizard({ workspace, userName }: OnboardingWizardProps) {
	const [step, setStep] = useState<Step>("workspace");
	const [workspaceName, setWorkspaceName] = useState(workspace.name);
	const [selectedRole, setSelectedRole] = useState<string | null>(null);
	const [projectName, setProjectName] = useState("");
	const [projectDescription, setProjectDescription] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
	const [seedingDemo, setSeedingDemo] = useState(false);

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
		setStep("role");
	}

	async function handleRoleSubmit() {
		if (!selectedRole) return;
		setError(null);
		setIsSubmitting(true);
		const result = await setOnboardingRoleAction(workspace.id, selectedRole);
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

	async function handleSeedDemo() {
		setSeedingDemo(true);
		setError(null);
		const result = await seedDemoWorkspaceAction();
		setSeedingDemo(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		// Navigate to the demo workspace
		window.location.href = `/${result.workspaceId}`;
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
				{STEPS.map((s, i) => (
					<div
						key={s}
						style={{
							width: i === stepIndex ? 24 : 8,
							height: 8,
							borderRadius: 4,
							backgroundColor:
								i <= stepIndex ? "var(--color-accent-gold)" : "var(--color-border-default)",
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
					{/* Step 1: Workspace name */}
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
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl"
									style={{ backgroundColor: "var(--color-accent-gold-muted)" }}
								>
									<Briefcase size={22} style={{ color: "var(--color-accent-gold)" }} />
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{
											fontFamily: "var(--font-display)",
											color: "var(--color-text-primary)",
										}}
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

					{/* Step 2: Role selection */}
					{step === "role" && (
						<motion.div
							key="role"
							variants={variants}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.2, ease: "easeOut" }}
						>
							<div className="p-8 space-y-6">
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl"
									style={{
										backgroundColor: "var(--color-accent-purple-muted)",
									}}
								>
									<UserCircle size={22} style={{ color: "var(--color-accent-purple)" }} />
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{
											fontFamily: "var(--font-display)",
											color: "var(--color-text-primary)",
										}}
									>
										What's your role?
									</h1>
									<p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
										This helps us tailor the experience. You can change it later.
									</p>
								</div>

								<div className="space-y-2">
									{ROLES.map((role) => {
										const Icon = role.icon;
										const isSelected = selectedRole === role.value;
										return (
											<button
												key={role.value}
												type="button"
												onClick={() => setSelectedRole(role.value)}
												className="w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all"
												style={{
													backgroundColor: isSelected
														? "var(--color-accent-gold-muted)"
														: "var(--color-bg-raised)",
													border: `1px solid ${isSelected ? "var(--color-accent-gold-border)" : "var(--color-border-subtle)"}`,
												}}
											>
												<div
													className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
													style={{
														backgroundColor: isSelected
															? "var(--color-accent-gold-muted)"
															: "var(--color-bg-overlay)",
													}}
												>
													<Icon
														size={18}
														style={{
															color: isSelected
																? "var(--color-accent-gold)"
																: "var(--color-text-muted)",
														}}
													/>
												</div>
												<div className="min-w-0">
													<p
														className="text-sm font-medium"
														style={{
															color: "var(--color-text-primary)",
														}}
													>
														{role.label}
													</p>
													<p
														className="text-xs mt-0.5"
														style={{
															color: "var(--color-text-secondary)",
														}}
													>
														{role.description}
													</p>
												</div>
												{isSelected && (
													<Check
														size={16}
														className="flex-shrink-0 ml-auto"
														style={{
															color: "var(--color-accent-gold)",
														}}
													/>
												)}
											</button>
										);
									})}
								</div>

								{error && (
									<p className="text-sm" style={{ color: "var(--color-status-error)" }}>
										{error}
									</p>
								)}

								<button
									type="button"
									onClick={handleRoleSubmit}
									disabled={isSubmitting || !selectedRole}
									className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all"
									style={{
										background: "var(--gradient-gold)",
										color: "var(--color-text-inverse)",
										opacity: isSubmitting || !selectedRole ? 0.6 : 1,
									}}
								>
									{isSubmitting ? "Saving…" : "Continue"}
									{!isSubmitting && <ArrowRight size={15} />}
								</button>
							</div>
						</motion.div>
					)}

					{/* Step 3: Create project */}
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
								<div
									className="flex h-12 w-12 items-center justify-center rounded-xl"
									style={{
										backgroundColor: "var(--color-accent-blue-muted)",
									}}
								>
									<FolderOpen size={22} style={{ color: "var(--color-accent-blue)" }} />
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{
											fontFamily: "var(--font-display)",
											color: "var(--color-text-primary)",
										}}
									>
										Create your first project
									</h1>
									<p className="mt-1.5 text-sm" style={{ color: "var(--color-text-muted)" }}>
										Projects are where you store research, generate insights, and build your product
										roadmap.
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
											<span
												style={{
													opacity: 0.5,
													fontFamily: "var(--font-sans)",
												}}
											>
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

					{/* Step 4: Done */}
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
								<div className="flex justify-center">
									<div
										className="flex h-14 w-14 items-center justify-center rounded-full"
										style={{
											backgroundColor: "var(--color-status-success-bg)",
										}}
									>
										<Check size={26} style={{ color: "var(--color-accent-green)" }} />
									</div>
								</div>

								<div>
									<h1
										className="text-2xl font-semibold tracking-tight"
										style={{
											fontFamily: "var(--font-display)",
											color: "var(--color-text-primary)",
										}}
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
										<Check
											size={13}
											style={{
												color: "var(--color-accent-gold)",
												flexShrink: 0,
											}}
										/>
										<span style={{ color: "var(--color-text-secondary)" }}>
											Workspace:{" "}
											<span
												style={{
													color: "var(--color-text-primary)",
													fontWeight: 500,
												}}
											>
												{workspaceName}
											</span>
										</span>
									</div>
									{selectedRole && (
										<div className="flex items-center gap-2 text-sm">
											<Check
												size={13}
												style={{
													color: "var(--color-accent-gold)",
													flexShrink: 0,
												}}
											/>
											<span style={{ color: "var(--color-text-secondary)" }}>
												Role:{" "}
												<span
													style={{
														color: "var(--color-text-primary)",
														fontWeight: 500,
													}}
												>
													{ROLES.find((r) => r.value === selectedRole)?.label ?? selectedRole}
												</span>
											</span>
										</div>
									)}
									{createdProjectId && (
										<div className="flex items-center gap-2 text-sm">
											<Check
												size={13}
												style={{
													color: "var(--color-accent-gold)",
													flexShrink: 0,
												}}
											/>
											<span style={{ color: "var(--color-text-secondary)" }}>
												Project:{" "}
												<span
													style={{
														color: "var(--color-text-primary)",
														fontWeight: 500,
													}}
												>
													{projectName}
												</span>
											</span>
										</div>
									)}
								</div>

								{/* Phase overview */}
								<div className="text-left">
									<p
										className="text-xs font-medium mb-3"
										style={{
											fontFamily: "var(--font-mono)",
											color: "var(--color-text-muted)",
											letterSpacing: "var(--tracking-wide)",
										}}
									>
										YOUR DISCOVERY WORKFLOW
									</p>
									<div className="grid grid-cols-5 gap-2">
										{[
											{
												icon: BookOpen,
												label: "Vault",
												color: "var(--color-accent-gold)",
											},
											{
												icon: Sparkles,
												label: "Engine",
												color: "var(--color-accent-blue)",
											},
											{
												icon: GitBranch,
												label: "Map",
												color: "var(--color-accent-coral)",
											},
											{
												icon: BarChart3,
												label: "Stack",
												color: "var(--color-accent-green)",
											},
											{
												icon: Users,
												label: "Team",
												color: "var(--color-accent-purple)",
											},
										].map((phase) => {
											const Icon = phase.icon;
											return (
												<div key={phase.label} className="flex flex-col items-center gap-1.5 py-2">
													<Icon size={16} style={{ color: phase.color }} />
													<span
														className="text-xs"
														style={{
															color: "var(--color-text-secondary)",
															fontFamily: "var(--font-mono)",
															letterSpacing: "var(--tracking-wide)",
														}}
													>
														{phase.label}
													</span>
												</div>
											);
										})}
									</div>
								</div>

								<div className="flex flex-col gap-2">
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
									<button
										type="button"
										onClick={handleSeedDemo}
										disabled={seedingDemo}
										className="w-full py-2 text-sm transition-opacity hover:opacity-80"
										style={{ color: "var(--color-text-muted)" }}
									>
										{seedingDemo ? "Creating demo…" : "Or explore a demo workspace first"}
									</button>
								</div>

								{error && (
									<p className="text-sm" style={{ color: "var(--color-status-error)" }}>
										{error}
									</p>
								)}
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
