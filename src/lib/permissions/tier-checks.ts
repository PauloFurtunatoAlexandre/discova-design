import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { Tier } from "./types";

/**
 * Get the user's tier in a workspace.
 * Returns null if the user is not an active member.
 * A member with removed_at set is NOT active.
 */
export async function getTier(userId: string, workspaceId: string): Promise<Tier | null> {
	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, userId),
			eq(workspaceMembers.workspaceId, workspaceId),
			isNull(workspaceMembers.removedAt),
		),
		columns: { tier: true, inviteAcceptedAt: true },
	});

	// Not a member, or invite not yet accepted
	if (!membership) return null;
	if (!membership.inviteAcceptedAt) return null;

	return membership.tier as Tier;
}

/** Check if user is an Admin of the workspace */
export async function isAdmin(userId: string, workspaceId: string): Promise<boolean> {
	const tier = await getTier(userId, workspaceId);
	return tier === "admin";
}

/** Check if user is a Member OR Admin of the workspace (not Viewer) */
export async function isMember(userId: string, workspaceId: string): Promise<boolean> {
	const tier = await getTier(userId, workspaceId);
	return tier === "admin" || tier === "member";
}

/** Check if user is a Viewer of the workspace */
export async function isViewer(userId: string, workspaceId: string): Promise<boolean> {
	const tier = await getTier(userId, workspaceId);
	return tier === "viewer";
}
