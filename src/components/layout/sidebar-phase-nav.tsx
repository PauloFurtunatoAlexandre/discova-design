"use client";

import { PHASES } from "@/lib/constants/phases";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarPhaseNavProps {
	workspaceId: string;
	projectId?: string | undefined;
}

export function SidebarPhaseNav({ workspaceId, projectId }: SidebarPhaseNavProps) {
	const pathname = usePathname();
	const shouldReduceMotion = useReducedMotion();

	const segments = pathname.split("/").filter(Boolean);
	const activePhase = segments.length >= 3 ? segments[2] : undefined;

	if (!projectId) {
		return (
			<div className="px-4 py-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
				Select a project to see phases
			</div>
		);
	}

	const containerVariants = {
		hidden: {},
		visible: {
			transition: {
				staggerChildren: shouldReduceMotion ? 0 : 0.05,
			},
		},
	};

	const itemVariants = {
		hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -10 },
		visible: {
			opacity: 1,
			x: 0,
			transition: { type: "spring" as const, stiffness: 300, damping: 30 },
		},
	};

	return (
		<div className="flex flex-col">
			<div
				className="px-4 py-2 text-xs font-semibold uppercase tracking-wider"
				style={{ color: "var(--color-text-muted)" }}
			>
				Phases
			</div>
			<AnimatePresence>
				<motion.ul
					className="flex flex-col gap-0.5 px-2 pb-2"
					initial="hidden"
					animate="visible"
					variants={containerVariants}
				>
					{PHASES.map((phase) => {
						const isActive = phase.id === activePhase;
						const Icon = phase.icon;

						return (
							<motion.li key={phase.id} variants={itemVariants}>
								<Link
									href={`/${workspaceId}/${projectId}/${phase.route}`}
									className="relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:opacity-90"
									style={{
										backgroundColor: isActive ? `var(${phase.accentMutedVar})` : undefined,
										color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
									}}
									data-active={isActive}
									aria-current={isActive ? "page" : undefined}
								>
									{/* Active indicator bar */}
									{isActive &&
										(shouldReduceMotion ? (
											<div
												className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-r-full"
												style={{
													backgroundColor: `var(${phase.accentVar})`,
												}}
											/>
										) : (
											<motion.div
												layoutId="phase-indicator"
												className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 rounded-r-full"
												style={{
													backgroundColor: `var(${phase.accentVar})`,
												}}
											/>
										))}

									{/* Icon */}
									<Icon
										size={16}
										style={{
											color: isActive ? `var(${phase.accentVar})` : undefined,
											flexShrink: 0,
										}}
									/>

									{/* Label */}
									<span className="flex-1">{phase.label}</span>

									{/* Phase number */}
									<span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
										{phase.number}
									</span>
								</Link>
							</motion.li>
						);
					})}
				</motion.ul>
			</AnimatePresence>
		</div>
	);
}
