"use client";

import { IntegrationCards } from "@/components/integrations/integration-cards";
import type { WorkspaceMember } from "@/lib/queries/team";
import { AnimatePresence } from "framer-motion";
import { Clock, Crown, Plug, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { InviteModal } from "./invite-modal";
import { MemberTable } from "./member-table";

interface TeamPageClientProps {
	members: WorkspaceMember[];
	stats: { totalMembers: number; admins: number; pending: number };
	workspaceId: string;
	currentUserId: string;
	isAdmin: boolean;
}

export function TeamPageClient({
	members,
	stats,
	workspaceId,
	currentUserId,
	isAdmin,
}: TeamPageClientProps) {
	const [inviteOpen, setInviteOpen] = useState(false);

	return (
		<div className="mx-auto max-w-5xl px-6 py-8">
			{/* Header */}
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1
						className="text-2xl font-semibold"
						style={{
							fontFamily: "var(--font-display)",
							color: "var(--color-text-primary)",
						}}
					>
						Team
					</h1>
					<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
						Manage workspace members, roles, and presets.
					</p>
				</div>
				{isAdmin && (
					<button
						type="button"
						onClick={() => setInviteOpen(true)}
						className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
						style={{
							background: "var(--color-accent-purple)",
							color: "var(--color-text-inverse)",
						}}
					>
						<UserPlus size={16} />
						Invite Member
					</button>
				)}
			</div>

			{/* Stats */}
			<div className="grid grid-cols-3 gap-4 mb-8">
				<StatCard
					icon={Users}
					label="Total Members"
					value={stats.totalMembers}
					color="var(--color-accent-purple)"
				/>
				<StatCard
					icon={Crown}
					label="Admins"
					value={stats.admins}
					color="var(--color-accent-gold)"
				/>
				<StatCard
					icon={Clock}
					label="Pending Invites"
					value={stats.pending}
					color="var(--color-accent-blue)"
				/>
			</div>

			{/* Table */}
			{members.length === 0 ? (
				<div
					className="flex flex-col items-center justify-center py-16 rounded-xl"
					style={{
						border: "1px dashed var(--color-border-subtle)",
						backgroundColor: "var(--color-bg-sunken)",
					}}
				>
					<Users size={40} style={{ color: "var(--color-text-muted)", opacity: 0.5 }} />
					<p className="mt-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
						No team members yet. Invite someone to get started.
					</p>
				</div>
			) : (
				<MemberTable
					members={members}
					workspaceId={workspaceId}
					currentUserId={currentUserId}
					isAdmin={isAdmin}
				/>
			)}

			{/* Integrations */}
			<div className="mt-12">
				<div className="flex items-center gap-2 mb-4">
					<Plug size={18} style={{ color: "var(--color-text-muted)" }} />
					<h2
						className="text-lg font-semibold"
						style={{
							fontFamily: "var(--font-display)",
							color: "var(--color-text-primary)",
						}}
					>
						Integrations
					</h2>
				</div>
				<p className="text-sm mb-5" style={{ color: "var(--color-text-muted)" }}>
					Connect your workspace to external tools.
				</p>
				<IntegrationCards workspaceId={workspaceId} isAdmin={isAdmin} />
			</div>

			{/* Invite Modal */}
			<AnimatePresence>
				{inviteOpen && (
					<InviteModal
						isOpen={inviteOpen}
						onClose={() => setInviteOpen(false)}
						workspaceId={workspaceId}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
	icon: Icon,
	label,
	value,
	color,
}: {
	icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
	label: string;
	value: number;
	color: string;
}) {
	return (
		<div
			className="flex items-center gap-4 px-5 py-4 rounded-xl"
			style={{
				backgroundColor: "var(--color-bg-surface)",
				border: "1px solid var(--color-border-subtle)",
			}}
		>
			<div
				className="flex items-center justify-center rounded-lg"
				style={{
					width: 40,
					height: 40,
					backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
				}}
			>
				<Icon size={20} style={{ color }} />
			</div>
			<div>
				<p
					className="text-2xl font-semibold"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					{value}
				</p>
				<p
					className="text-xs uppercase"
					style={{
						fontFamily: "var(--font-mono)",
						color: "var(--color-text-muted)",
						letterSpacing: "var(--tracking-wide)",
					}}
				>
					{label}
				</p>
			</div>
		</div>
	);
}
