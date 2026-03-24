import { BarChart3, BookOpen, GitBranch, type LucideIcon, Sparkles, Users } from "lucide-react";

export interface PhaseConfig {
	id: string;
	name: string;
	label: string;
	description: string;
	route: string;
	icon: LucideIcon;
	accentVar: string;
	accentMutedVar: string;
	number: string;
}

export const PHASES: PhaseConfig[] = [
	{
		id: "vault",
		name: "Research Vault",
		label: "Vault",
		description: "Capture and organise research",
		route: "vault",
		icon: BookOpen,
		accentVar: "--color-accent-gold",
		accentMutedVar: "--color-accent-gold-muted",
		number: "01",
	},
	{
		id: "engine",
		name: "Insight Engine",
		label: "Engine",
		description: "AI-assisted synthesis",
		route: "engine",
		icon: Sparkles,
		accentVar: "--color-accent-blue",
		accentMutedVar: "--color-accent-blue-muted",
		number: "02",
	},
	{
		id: "map",
		name: "Opportunity Map",
		label: "Map",
		description: "Connect insights to solutions",
		route: "map",
		icon: GitBranch,
		accentVar: "--color-accent-coral",
		accentMutedVar: "--color-accent-coral-muted",
		number: "03",
	},
	{
		id: "stack",
		name: "Priority Stack",
		label: "Stack",
		description: "Evidence-backed prioritisation",
		route: "stack",
		icon: BarChart3,
		accentVar: "--color-accent-green",
		accentMutedVar: "--color-accent-green-muted",
		number: "04",
	},
	{
		id: "team",
		name: "Team",
		label: "Team",
		description: "Collaborate and share",
		route: "team",
		icon: Users,
		accentVar: "--color-accent-purple",
		accentMutedVar: "--color-accent-purple-muted",
		number: "05",
	},
];

export const PHASE_MAP = Object.fromEntries(PHASES.map((p) => [p.id, p])) as Record<
	string,
	PhaseConfig
>;
