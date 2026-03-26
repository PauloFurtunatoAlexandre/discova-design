"use server";

import { auth } from "@/lib/auth/config";
import type { PresenceUser } from "@/lib/queries/presence";
import { getActivePresence, upsertPresence } from "@/lib/queries/presence";

export async function heartbeatAction(args: {
	projectId: string;
	phase: "vault" | "engine" | "map" | "stack" | "team" | null;
}): Promise<{ users: PresenceUser[] } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	await upsertPresence(session.user.id, args.projectId, args.phase);
	const users = await getActivePresence(args.projectId);

	// Exclude self from the list
	return {
		users: users.filter((u) => u.userId !== session.user!.id),
	};
}
