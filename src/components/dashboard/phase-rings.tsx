"use client";

import type { DashboardData } from "@/lib/queries/dashboard";
import { PhaseRing } from "./phase-ring";

interface PhaseRingsProps {
	data: DashboardData;
	workspaceId: string;
	projectId: string;
}

const PHASES = [
	{
		key: "vault" as const,
		label: "Vault",
		color: "var(--color-accent-gold)",
		glowColor: "var(--shadow-glow-gold)",
		segment: "vault",
	},
	{
		key: "engine" as const,
		label: "Engine",
		color: "var(--color-accent-blue)",
		glowColor: "var(--shadow-glow-blue)",
		segment: "engine",
	},
	{
		key: "map" as const,
		label: "Map",
		color: "var(--color-accent-coral)",
		glowColor: "var(--shadow-glow-coral)",
		segment: "map",
	},
	{
		key: "stack" as const,
		label: "Stack",
		color: "var(--color-accent-green)",
		glowColor: "",
		segment: "stack",
	},
	{
		key: "team" as const,
		label: "Team",
		color: "var(--color-accent-purple)",
		glowColor: "",
		segment: "team",
	},
] as const;

export function PhaseRings({ data, workspaceId, projectId }: PhaseRingsProps) {
	return (
		<div className="grid grid-cols-3 gap-6 sm:grid-cols-5">
			{PHASES.map((phase, index) => {
				const stats = data.phases[phase.key];
				return (
					<PhaseRing
						key={phase.key}
						label={phase.label}
						percentage={stats.percentage}
						completed={stats.completed}
						total={stats.total}
						color={phase.color}
						glowColor={phase.glowColor}
						href={`/${workspaceId}/${projectId}/${phase.segment}`}
						index={index}
					/>
				);
			})}
		</div>
	);
}
