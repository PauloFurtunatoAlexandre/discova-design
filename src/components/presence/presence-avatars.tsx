"use client";

import { usePresence } from "@/hooks/usePresence";
import { AnimatePresence, motion } from "framer-motion";

type Phase = "vault" | "engine" | "map" | "stack" | "team";

interface PresenceAvatarsProps {
	projectId: string;
	workspaceId: string;
	phase: Phase | null;
}

const PHASE_LABELS: Record<string, string> = {
	vault: "Vault",
	engine: "Engine",
	map: "Map",
	stack: "Stack",
	team: "Team",
};

export function PresenceAvatars({ projectId, workspaceId, phase }: PresenceAvatarsProps) {
	const users = usePresence(projectId, workspaceId, phase);

	if (users.length === 0) return null;

	const visible = users.slice(0, 5);
	const overflow = users.length - 5;

	return (
		<div className="flex items-center gap-2">
			<div className="flex -space-x-2">
				<AnimatePresence mode="popLayout">
					{visible.map((user) => (
						<motion.div
							key={user.userId}
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.8 }}
							transition={{ type: "spring", stiffness: 400, damping: 25 }}
							className="relative group"
						>
							<div
								className="flex items-center justify-center rounded-full text-xs font-semibold"
								style={{
									width: 28,
									height: 28,
									backgroundColor: user.avatarUrl
										? "transparent"
										: "var(--color-accent-purple-muted)",
									color: "var(--color-accent-purple)",
									boxShadow: "0 0 0 2px var(--color-bg-base)",
									overflow: "hidden",
								}}
								title={`${user.name}${user.phase ? ` — ${PHASE_LABELS[user.phase] ?? user.phase}` : ""}`}
							>
								{user.avatarUrl ? (
									<img
										src={user.avatarUrl}
										alt={user.name}
										className="w-full h-full object-cover"
									/>
								) : (
									user.name.charAt(0).toUpperCase()
								)}
							</div>
							{/* Online dot */}
							<div
								className="absolute -bottom-0.5 -right-0.5 rounded-full"
								style={{
									width: 8,
									height: 8,
									backgroundColor: "var(--color-status-success)",
									boxShadow: "0 0 0 2px var(--color-bg-base)",
								}}
							/>
							{/* Tooltip */}
							<div
								className="absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
								style={{
									backgroundColor: "var(--color-bg-elevated)",
									color: "var(--color-text-primary)",
									border: "1px solid var(--color-border-subtle)",
									boxShadow: "var(--shadow-sm)",
									zIndex: 50,
								}}
							>
								{user.name}
								{user.phase && (
									<span style={{ color: "var(--color-text-muted)" }}>
										{" "}
										in {PHASE_LABELS[user.phase] ?? user.phase}
									</span>
								)}
							</div>
						</motion.div>
					))}
				</AnimatePresence>

				{overflow > 0 && (
					<div
						className="flex items-center justify-center rounded-full text-xs font-medium"
						style={{
							width: 28,
							height: 28,
							backgroundColor: "var(--color-bg-elevated)",
							color: "var(--color-text-muted)",
							boxShadow: "0 0 0 2px var(--color-bg-base)",
						}}
					>
						+{overflow}
					</div>
				)}
			</div>

			<span
				className="text-xs"
				style={{
					fontFamily: "var(--font-mono)",
					color: "var(--color-text-muted)",
				}}
			>
				{users.length} online
			</span>
		</div>
	);
}
