"use client";

import { FileText, Layers, Lightbulb, Network } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsProps {
	workspaceId: string;
	projectId: string;
}

const ACTIONS = [
	{
		label: "Add research note",
		description: "Capture raw observations",
		icon: FileText,
		color: "var(--color-accent-gold)",
		bg: "var(--color-accent-gold-muted)",
		segment: "vault",
	},
	{
		label: "Create insight",
		description: "Synthesise a finding",
		icon: Lightbulb,
		color: "var(--color-accent-blue)",
		bg: "var(--color-accent-blue-muted)",
		segment: "engine",
	},
	{
		label: "Open map",
		description: "Connect problems & solutions",
		icon: Network,
		color: "var(--color-accent-coral)",
		bg: "var(--color-accent-coral-muted)",
		segment: "map",
	},
	{
		label: "View stack",
		description: "Prioritise by RICE score",
		icon: Layers,
		color: "var(--color-accent-green)",
		bg: "var(--color-accent-green-muted)",
		segment: "stack",
	},
] as const;

export function QuickActions({ workspaceId, projectId }: QuickActionsProps) {
	const router = useRouter();

	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
			{ACTIONS.map((action) => {
				const Icon = action.icon;
				return (
					<button
						key={action.segment}
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/${action.segment}`)}
						className="group flex flex-col gap-3 rounded-xl p-4 text-left transition-all duration-150 hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
						style={{
							background: "var(--color-bg-surface)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						<div
							className="flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-150 group-hover:scale-105"
							style={{ background: action.bg }}
						>
							<Icon size={17} style={{ color: action.color }} strokeWidth={1.75} />
						</div>
						<div>
							<p
								className="text-sm font-medium leading-tight"
								style={{ color: "var(--color-text-primary)" }}
							>
								{action.label}
							</p>
							<p
								className="text-xs mt-0.5 leading-tight"
								style={{ color: "var(--color-text-muted)" }}
							>
								{action.description}
							</p>
						</div>
					</button>
				);
			})}
		</div>
	);
}
