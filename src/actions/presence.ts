"use server";

import { auth } from "@/lib/auth/config";
import { isMember } from "@/lib/permissions/tier-checks";
import type { PresenceUser } from "@/lib/queries/presence";
import { getActivePresence, upsertPresence } from "@/lib/queries/presence";

export async function heartbeatAction(args: {
	projectId: string;
	workspaceId: string;
	phase: "vault" | "engine" | "map" | "stack" | "team" | null;
}): Promise<{ users: PresenceUser[] } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	// Verify user belongs to the workspace
	if (!(await isMember(session.user.id, args.workspaceId))) {
		return { error: "Forbidden" };
	}

	await upsertPresence(session.user.id, args.projectId, args.phase);
	const users = await getActivePresence(args.projectId);

	// Exclude self from the list
	return {
		users: users.filter((u) => u.userId !== session.user!.id),
	};
}
