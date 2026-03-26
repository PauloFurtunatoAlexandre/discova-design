"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { InviteMemberEmail } from "@/lib/email/templates/invite-member";
import { getTier } from "@/lib/permissions/tier-checks";
import {
	changePresetSchema,
	changeTierSchema,
	inviteMemberSchema,
	removeMemberSchema,
} from "@/lib/validations/team";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireAdmin(userId: string, workspaceId: string) {
	const tier = await getTier(userId, workspaceId);
	if (tier !== "admin") {
		return { error: "Only admins can manage team members" };
	}
	return null;
}

// ── Invite Member ────────────────────────────────────────────────────────────

export async function inviteMemberAction(args: {
	workspaceId: string;
	email: string;
	tier: "member" | "viewer";
	workspacePreset: "researcher" | "pm" | "member" | null;
}): Promise<{ success: true; memberId: string } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const adminCheck = await requireAdmin(session.user.id, args.workspaceId);
	if (adminCheck) return adminCheck;

	const parsed = inviteMemberSchema.safeParse({
		email: args.email,
		tier: args.tier,
		workspacePreset: args.workspacePreset,
	});
	if (!parsed.success) {
		return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
	}

	// Check if user exists
	const [existingUser] = await db
		.select({ id: users.id, name: users.name })
		.from(users)
		.where(eq(users.email, parsed.data.email))
		.limit(1);

	if (!existingUser) {
		return { error: "No account found for this email. They need to sign up first." };
	}

	// Check if already a member
	const [existingMember] = await db
		.select({ id: workspaceMembers.id, removedAt: workspaceMembers.removedAt })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, args.workspaceId),
				eq(workspaceMembers.userId, existingUser.id),
			),
		)
		.limit(1);

	if (existingMember && !existingMember.removedAt) {
		return { error: "This person is already a member of this workspace" };
	}

	// If previously removed, reactivate
	if (existingMember?.removedAt) {
		await db
			.update(workspaceMembers)
			.set({
				tier: parsed.data.tier,
				workspacePreset: parsed.data.workspacePreset,
				removedAt: null,
				invitedBy: session.user.id,
				inviteAcceptedAt: null,
			})
			.where(eq(workspaceMembers.id, existingMember.id));

		sendEmail({
			to: parsed.data.email,
			subject: "You've been invited back to a Discova workspace",
			react: InviteMemberEmail(),
		}).catch(() => {});

		createAuditEntry({
			workspaceId: args.workspaceId,
			userId: session.user.id,
			action: "team.member.reinvited",
			targetType: "workspace_member",
			targetId: existingMember.id,
			metadata: { email: parsed.data.email, tier: parsed.data.tier },
		}).catch(() => {});

		revalidatePath(`/${args.workspaceId}`);
		return { success: true, memberId: existingMember.id };
	}

	// Create new membership
	const [member] = await db
		.insert(workspaceMembers)
		.values({
			workspaceId: args.workspaceId,
			userId: existingUser.id,
			tier: parsed.data.tier,
			workspacePreset: parsed.data.workspacePreset,
			invitedBy: session.user.id,
		})
		.returning({ id: workspaceMembers.id });

	if (!member) {
		return { error: "Failed to create membership" };
	}

	// Send invite email (fire-and-forget)
	sendEmail({
		to: parsed.data.email,
		subject: "You've been invited to a Discova workspace",
		react: InviteMemberEmail(),
	}).catch(() => {});

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "team.member.invited",
		targetType: "workspace_member",
		targetId: member.id,
		metadata: { email: parsed.data.email, tier: parsed.data.tier },
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true, memberId: member.id };
}

// ── Accept Invite ────────────────────────────────────────────────────────────

export async function acceptInviteAction(args: {
	workspaceId: string;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const [member] = await db
		.select({ id: workspaceMembers.id })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.workspaceId, args.workspaceId),
				eq(workspaceMembers.userId, session.user.id),
				isNull(workspaceMembers.inviteAcceptedAt),
				isNull(workspaceMembers.removedAt),
			),
		)
		.limit(1);

	if (!member) {
		return { error: "No pending invite found" };
	}

	await db
		.update(workspaceMembers)
		.set({ inviteAcceptedAt: new Date() })
		.where(eq(workspaceMembers.id, member.id));

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "team.invite.accepted",
		targetType: "workspace_member",
		targetId: member.id,
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}

// ── Change Tier ──────────────────────────────────────────────────────────────

export async function changeTierAction(args: {
	workspaceId: string;
	memberId: string;
	tier: "admin" | "member" | "viewer";
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const adminCheck = await requireAdmin(session.user.id, args.workspaceId);
	if (adminCheck) return adminCheck;

	const parsed = changeTierSchema.safeParse({
		memberId: args.memberId,
		tier: args.tier,
	});
	if (!parsed.success) return { error: "Invalid input" };

	// Verify member belongs to workspace
	const [member] = await db
		.select({ id: workspaceMembers.id, userId: workspaceMembers.userId })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.id, parsed.data.memberId),
				eq(workspaceMembers.workspaceId, args.workspaceId),
				isNull(workspaceMembers.removedAt),
			),
		)
		.limit(1);

	if (!member) return { error: "Member not found" };

	// Cannot change own tier
	if (member.userId === session.user.id) {
		return { error: "You cannot change your own role" };
	}

	await db
		.update(workspaceMembers)
		.set({ tier: parsed.data.tier })
		.where(eq(workspaceMembers.id, parsed.data.memberId));

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "team.tier.changed",
		targetType: "workspace_member",
		targetId: parsed.data.memberId,
		metadata: { newTier: parsed.data.tier },
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}

// ── Change Preset ────────────────────────────────────────────────────────────

export async function changePresetAction(args: {
	workspaceId: string;
	memberId: string;
	workspacePreset: "researcher" | "pm" | "member" | null;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const adminCheck = await requireAdmin(session.user.id, args.workspaceId);
	if (adminCheck) return adminCheck;

	const parsed = changePresetSchema.safeParse({
		memberId: args.memberId,
		workspacePreset: args.workspacePreset,
	});
	if (!parsed.success) return { error: "Invalid input" };

	const [member] = await db
		.select({ id: workspaceMembers.id })
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.id, parsed.data.memberId),
				eq(workspaceMembers.workspaceId, args.workspaceId),
				isNull(workspaceMembers.removedAt),
			),
		)
		.limit(1);

	if (!member) return { error: "Member not found" };

	await db
		.update(workspaceMembers)
		.set({ workspacePreset: parsed.data.workspacePreset })
		.where(eq(workspaceMembers.id, parsed.data.memberId));

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "team.preset.changed",
		targetType: "workspace_member",
		targetId: parsed.data.memberId,
		metadata: { newPreset: parsed.data.workspacePreset },
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}

// ── Remove Member ────────────────────────────────────────────────────────────

export async function removeMemberAction(args: {
	workspaceId: string;
	memberId: string;
	anonymize: boolean;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const adminCheck = await requireAdmin(session.user.id, args.workspaceId);
	if (adminCheck) return adminCheck;

	const parsed = removeMemberSchema.safeParse({
		memberId: args.memberId,
		anonymize: args.anonymize,
	});
	if (!parsed.success) return { error: "Invalid input" };

	// Verify member belongs to workspace
	const [member] = await db
		.select({
			id: workspaceMembers.id,
			userId: workspaceMembers.userId,
			tier: workspaceMembers.tier,
		})
		.from(workspaceMembers)
		.where(
			and(
				eq(workspaceMembers.id, parsed.data.memberId),
				eq(workspaceMembers.workspaceId, args.workspaceId),
				isNull(workspaceMembers.removedAt),
			),
		)
		.limit(1);

	if (!member) return { error: "Member not found" };

	// Cannot remove yourself
	if (member.userId === session.user.id) {
		return { error: "You cannot remove yourself from the workspace" };
	}

	// Cannot remove another admin (must demote first)
	if (member.tier === "admin") {
		return { error: "Demote the admin before removing them" };
	}

	// Soft-delete the membership
	await db
		.update(workspaceMembers)
		.set({ removedAt: new Date() })
		.where(eq(workspaceMembers.id, parsed.data.memberId));

	// Anonymize if requested
	if (parsed.data.anonymize) {
		const anonymousName = `Former Member ${member.id.slice(0, 6)}`;
		await db
			.update(users)
			.set({
				name: anonymousName,
				avatarUrl: null,
				jobTitle: null,
				updatedAt: new Date(),
			})
			.where(eq(users.id, member.userId));
	}

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "team.member.removed",
		targetType: "workspace_member",
		targetId: parsed.data.memberId,
		metadata: { anonymized: parsed.data.anonymize },
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}
