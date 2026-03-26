"use client";

import { changePresetAction, changeTierAction, removeMemberAction } from "@/actions/team";
import type { WorkspaceMember } from "@/lib/queries/team";
import { AnimatePresence, motion } from "framer-motion";
import { Crown, Eye, MoreHorizontal, Shield, UserMinus, UserX } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

// ── Role config ───────────────────────────────────────────────────────────────

const TIER_CONFIG = {
	admin: {
		label: "Admin",
		icon: Crown,
		color: "var(--color-accent-gold)",
		bg: "var(--color-accent-gold-muted)",
	},
	member: {
		label: "Member",
		icon: Shield,
		color: "var(--color-accent-blue)",
		bg: "var(--color-accent-blue-muted)",
	},
	viewer: {
		label: "Viewer",
		icon: Eye,
		color: "var(--color-text-muted)",
		bg: "var(--color-bg-elevated)",
	},
} as const;

const PRESET_LABELS: Record<string, string> = {
	researcher: "Researcher",
	pm: "PM",
	member: "Member",
};

// ── Props ────────────────────────────────────────────────────────────────────

interface MemberTableProps {
	members: WorkspaceMember[];
	workspaceId: string;
	currentUserId: string;
	isAdmin: boolean;
}

export function MemberTable({ members, workspaceId, currentUserId, isAdmin }: MemberTableProps) {
	return (
		<div
			style={{
				border: "1px solid var(--color-border-subtle)",
				borderRadius: "var(--radius-lg)",
				overflow: "hidden",
			}}
		>
			{/* Header */}
			<div
				className="grid items-center px-5 py-3 text-xs font-medium uppercase"
				style={{
					gridTemplateColumns: "1fr 120px 120px 100px 48px",
					fontFamily: "var(--font-mono)",
					color: "var(--color-text-muted)",
					letterSpacing: "var(--tracking-wide)",
					backgroundColor: "var(--color-bg-sunken)",
					borderBottom: "1px solid var(--color-border-subtle)",
				}}
			>
				<span>Member</span>
				<span>Role</span>
				<span>Preset</span>
				<span>Status</span>
				<span />
			</div>

			{/* Rows */}
			<div>
				{members.map((member) => (
					<MemberRow
						key={member.id}
						member={member}
						workspaceId={workspaceId}
						currentUserId={currentUserId}
						isAdmin={isAdmin}
					/>
				))}
			</div>
		</div>
	);
}

// ── Member Row ───────────────────────────────────────────────────────────────

function MemberRow({
	member,
	workspaceId,
	currentUserId,
	isAdmin,
}: {
	member: WorkspaceMember;
	workspaceId: string;
	currentUserId: string;
	isAdmin: boolean;
}) {
	const router = useRouter();
	const [menuOpen, setMenuOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const isSelf = member.userId === currentUserId;
	const tierConfig = TIER_CONFIG[member.tier];
	const TierIcon = tierConfig.icon;

	function handleChangeTier(newTier: "admin" | "member" | "viewer") {
		setMenuOpen(false);
		startTransition(async () => {
			await changeTierAction({
				workspaceId,
				memberId: member.id,
				tier: newTier,
			});
			router.refresh();
		});
	}

	function handleChangePreset(newPreset: "researcher" | "pm" | "member" | null) {
		startTransition(async () => {
			await changePresetAction({
				workspaceId,
				memberId: member.id,
				workspacePreset: newPreset,
			});
			router.refresh();
		});
	}

	function handleRemove(anonymize: boolean) {
		setMenuOpen(false);
		startTransition(async () => {
			await removeMemberAction({
				workspaceId,
				memberId: member.id,
				anonymize,
			});
			router.refresh();
		});
	}

	return (
		<div
			className="grid items-center px-5 py-3 transition-colors"
			style={{
				gridTemplateColumns: "1fr 120px 120px 100px 48px",
				borderBottom: "1px solid var(--color-border-subtle)",
				opacity: isPending ? 0.5 : 1,
			}}
		>
			{/* Avatar + Name + Email */}
			<div className="flex items-center gap-3 min-w-0">
				<div
					className="flex-shrink-0 flex items-center justify-center rounded-full text-sm font-semibold"
					style={{
						width: 36,
						height: 36,
						backgroundColor: member.avatarUrl ? "transparent" : "var(--color-accent-purple-muted)",
						color: "var(--color-accent-purple)",
						border: member.avatarUrl ? "none" : "1px solid var(--color-accent-purple)",
						overflow: "hidden",
					}}
				>
					{member.avatarUrl ? (
						<img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
					) : (
						member.name.charAt(0).toUpperCase()
					)}
				</div>
				<div className="min-w-0">
					<p
						className="text-sm font-medium truncate"
						style={{ color: "var(--color-text-primary)" }}
					>
						{member.name}
						{isSelf && (
							<span className="ml-1.5 text-xs" style={{ color: "var(--color-text-muted)" }}>
								(you)
							</span>
						)}
					</p>
					<p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
						{member.email}
					</p>
				</div>
			</div>

			{/* Tier */}
			<div>
				{isAdmin && !isSelf ? (
					<select
						value={member.tier}
						onChange={(e) => handleChangeTier(e.target.value as "admin" | "member" | "viewer")}
						disabled={isPending}
						className="text-xs rounded-md px-2 py-1 outline-none cursor-pointer"
						style={{
							fontFamily: "var(--font-mono)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
							backgroundColor: tierConfig.bg,
							color: tierConfig.color,
							border: `1px solid ${tierConfig.color}`,
						}}
					>
						<option value="admin">Admin</option>
						<option value="member">Member</option>
						<option value="viewer">Viewer</option>
					</select>
				) : (
					<span
						className="inline-flex items-center gap-1.5 text-xs rounded-md px-2 py-1"
						style={{
							fontFamily: "var(--font-mono)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
							backgroundColor: tierConfig.bg,
							color: tierConfig.color,
							border: `1px solid ${tierConfig.color}`,
						}}
					>
						<TierIcon size={12} />
						{tierConfig.label}
					</span>
				)}
			</div>

			{/* Preset */}
			<div>
				{isAdmin && !isSelf ? (
					<select
						value={member.workspacePreset ?? ""}
						onChange={(e) => {
							const v = e.target.value;
							handleChangePreset(v === "" ? null : (v as "researcher" | "pm" | "member"));
						}}
						disabled={isPending}
						className="text-xs rounded-md px-2 py-1 outline-none cursor-pointer"
						style={{
							fontFamily: "var(--font-mono)",
							backgroundColor: "var(--color-bg-elevated)",
							color: "var(--color-text-secondary)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						<option value="">None</option>
						<option value="researcher">Researcher</option>
						<option value="pm">PM</option>
						<option value="member">Member</option>
					</select>
				) : (
					<span
						className="text-xs"
						style={{
							fontFamily: "var(--font-mono)",
							color: "var(--color-text-secondary)",
						}}
					>
						{member.workspacePreset
							? (PRESET_LABELS[member.workspacePreset] ?? member.workspacePreset)
							: "—"}
					</span>
				)}
			</div>

			{/* Status */}
			<div>
				{member.isPending ? (
					<span
						className="text-xs px-2 py-0.5 rounded-full"
						style={{
							fontFamily: "var(--font-mono)",
							backgroundColor: "var(--color-accent-gold-muted)",
							color: "var(--color-accent-gold)",
							border: "1px solid var(--color-accent-gold)",
						}}
					>
						Pending
					</span>
				) : (
					<span
						className="text-xs px-2 py-0.5 rounded-full"
						style={{
							fontFamily: "var(--font-mono)",
							backgroundColor: "var(--color-status-success-muted)",
							color: "var(--color-status-success)",
							border: "1px solid var(--color-status-success)",
						}}
					>
						Active
					</span>
				)}
			</div>

			{/* Actions menu */}
			<div className="relative">
				{isAdmin && !isSelf && (
					<>
						<button
							type="button"
							onClick={() => setMenuOpen(!menuOpen)}
							className="p-1 rounded-md transition-opacity hover:opacity-70"
							style={{ color: "var(--color-text-muted)" }}
							aria-label="Member actions"
						>
							<MoreHorizontal size={16} />
						</button>

						<AnimatePresence>
							{menuOpen && (
								<>
									<motion.div
										className="fixed inset-0"
										style={{ zIndex: 100 }}
										onClick={() => setMenuOpen(false)}
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										exit={{ opacity: 0 }}
									/>
									<motion.div
										className="absolute right-0 top-full mt-1 py-1 min-w-[180px]"
										style={{
											zIndex: 101,
											backgroundColor: "var(--color-bg-surface)",
											border: "1px solid var(--color-border-default)",
											borderRadius: "var(--radius-md)",
											boxShadow: "var(--shadow-lg)",
										}}
										initial={{ opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -4 }}
										transition={{ duration: 0.12 }}
									>
										<button
											type="button"
											onClick={() => handleRemove(false)}
											className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[--color-bg-elevated]"
											style={{ color: "var(--color-text-secondary)" }}
										>
											<UserMinus size={14} />
											Remove member
										</button>
										<button
											type="button"
											onClick={() => handleRemove(true)}
											className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors hover:bg-[--color-bg-elevated]"
											style={{ color: "var(--color-status-error)" }}
										>
											<UserX size={14} />
											Remove & anonymize
										</button>
									</motion.div>
								</>
							)}
						</AnimatePresence>
					</>
				)}
			</div>
		</div>
	);
}
