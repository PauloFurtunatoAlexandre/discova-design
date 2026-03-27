"use server";

import { auth } from "@/lib/auth/config";
import { isMember } from "@/lib/permissions/tier-checks";
import type { PresenceUser } from "@/lib/queries/presence";
import { getActivePresence, upsertPresence } from "@/lib/queries/presence";
import { z } from "zod";

const heartbeatSchema = z.object({
	projectId: z.string().uuid(),
	workspaceId: z.string().uuid(),
	phase: z.enum(["vault", "engine", "map", "stack", "team"]).nullable(),
});

export async function heartbeatAction(args: {
	projectId: string;
	workspaceId: string;
	phase: "vault" | "engine" | "map" | "stack" | "team" | null;
}): Promise<{ users: PresenceUser[] } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const parsed = heartbeatSchema.safeParse(args);
	if (!parsed.success) return { error: "Invalid input" };

	// Verify user belongs to the workspace
	if (!(await isMember(session.user.id, parsed.data.workspaceId))) {
		return { error: "Forbidden" };
	}

	await upsertPresence(session.user.id, parsed.data.projectId, parsed.data.phase);
	const users = await getActivePresence(parsed.data.projectId);

	// Exclude self from the list
	return {
		users: users.filter((u) => u.userId !== session.user!.id),
	};
}
