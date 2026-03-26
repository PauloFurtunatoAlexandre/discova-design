"use client";

import { disconnectIntegrationAction, getIntegrationsAction } from "@/actions/integrations";
import type { IntegrationType } from "@/lib/integrations/shared";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ExternalLink, Unplug } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

// ── Integration definitions ──────────────────────────────────────────────────

interface IntegrationDef {
	type: IntegrationType;
	name: string;
	description: string;
	icon: string;
	color: string;
	authUrlPath: string;
}

const INTEGRATIONS: IntegrationDef[] = [
	{
		type: "jira",
		name: "Jira",
		description: "Create and sync issues from your Priority Stack to Jira projects.",
		icon: "🔷",
		color: "#0052CC",
		authUrlPath: "/api/integrations/jira/auth",
	},
	{
		type: "linear",
		name: "Linear",
		description: "Push prioritized solutions to Linear as issues with RICE context.",
		icon: "🟣",
		color: "#5E6AD2",
		authUrlPath: "/api/integrations/linear/auth",
	},
	{
		type: "slack",
		name: "Slack",
		description: "Get notified in Slack when insights are validated or priorities change.",
		icon: "💬",
		color: "#4A154B",
		authUrlPath: "/api/integrations/slack/auth",
	},
	{
		type: "figma",
		name: "Figma",
		description: "Embed Figma frames in research notes and link designs to solutions.",
		icon: "🎨",
		color: "#F24E1E",
		authUrlPath: "/api/integrations/figma/auth",
	},
];

// ── Props ────────────────────────────────────────────────────────────────────

interface IntegrationCardsProps {
	workspaceId: string;
	isAdmin: boolean;
}

export function IntegrationCards({ workspaceId, isAdmin }: IntegrationCardsProps) {
	const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
	const [configs, setConfigs] = useState<Record<string, Record<string, unknown>>>({});

	useEffect(() => {
		getIntegrationsAction({ workspaceId }).then((result) => {
			if ("integrations" in result) {
				const active = new Set<string>();
				const cfgs: Record<string, Record<string, unknown>> = {};
				for (const i of result.integrations) {
					if (i.isActive) active.add(i.type);
					cfgs[i.type] = i.config;
				}
				setActiveTypes(active);
				setConfigs(cfgs);
			}
		});
	}, [workspaceId]);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
			{INTEGRATIONS.map((def) => (
				<IntegrationCard
					key={def.type}
					def={def}
					isActive={activeTypes.has(def.type)}
					config={configs[def.type]}
					workspaceId={workspaceId}
					isAdmin={isAdmin}
					onDisconnected={() => {
						setActiveTypes((prev) => {
							const next = new Set(prev);
							next.delete(def.type);
							return next;
						});
					}}
				/>
			))}
		</div>
	);
}

// ── Single Card ──────────────────────────────────────────────────────────────

function IntegrationCard({
	def,
	isActive,
	config,
	workspaceId,
	isAdmin,
	onDisconnected,
}: {
	def: IntegrationDef;
	isActive: boolean;
	config?: Record<string, unknown> | undefined;
	workspaceId: string;
	isAdmin: boolean;
	onDisconnected: () => void;
}) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	function handleConnect() {
		// Redirect to OAuth — the state param carries workspaceId
		window.location.href = `${def.authUrlPath}?state=${workspaceId}`;
	}

	function handleDisconnect() {
		startTransition(async () => {
			const result = await disconnectIntegrationAction({
				workspaceId,
				type: def.type,
			});
			if ("success" in result) {
				onDisconnected();
				router.refresh();
			}
		});
	}

	return (
		<motion.div
			layout
			className="rounded-xl p-5"
			style={{
				backgroundColor: "var(--color-bg-surface)",
				border: `1px solid ${isActive ? def.color : "var(--color-border-subtle)"}`,
				opacity: isPending ? 0.6 : 1,
			}}
		>
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-3">
					<span className="text-2xl">{def.icon}</span>
					<div>
						<h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
							{def.name}
						</h3>
						{isActive && (
							<span
								className="inline-flex items-center gap-1 text-xs"
								style={{ color: "var(--color-status-success)" }}
							>
								<Check size={10} />
								Connected
							</span>
						)}
					</div>
				</div>

				{isAdmin && (
					<div>
						{isActive ? (
							<button
								type="button"
								onClick={handleDisconnect}
								disabled={isPending}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
								style={{
									color: "var(--color-status-error)",
									border: "1px solid var(--color-status-error)",
									backgroundColor: "transparent",
								}}
							>
								<Unplug size={12} />
								Disconnect
							</button>
						) : (
							<button
								type="button"
								onClick={handleConnect}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
								style={{
									color: "var(--color-text-inverse)",
									backgroundColor: def.color,
								}}
							>
								<ExternalLink size={12} />
								Connect
							</button>
						)}
					</div>
				)}
			</div>

			<p className="text-xs" style={{ color: "var(--color-text-muted)", lineHeight: "18px" }}>
				{def.description}
			</p>

			{/* Active config summary */}
			<AnimatePresence>
				{isActive && config && Object.keys(config).length > 0 && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="overflow-hidden"
					>
						<div
							className="mt-3 pt-3 space-y-1"
							style={{ borderTop: "1px solid var(--color-border-subtle)" }}
						>
							{Object.entries(config)
								.filter(([, v]) => typeof v === "string" && v)
								.slice(0, 3)
								.map(([key, value]) => (
									<div key={key} className="flex items-center gap-2 text-xs">
										<span
											style={{
												fontFamily: "var(--font-mono)",
												color: "var(--color-text-muted)",
											}}
										>
											{formatConfigKey(key)}:
										</span>
										<span style={{ color: "var(--color-text-secondary)" }}>{String(value)}</span>
									</div>
								))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}

function formatConfigKey(key: string): string {
	return key
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (s) => s.toUpperCase())
		.trim();
}
