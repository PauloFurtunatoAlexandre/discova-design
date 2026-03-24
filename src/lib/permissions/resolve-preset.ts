import { db } from "@/lib/db";
import { projectMembers, users, workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import type { ResolvedPreset } from "./types";

/**
 * Resolve a user's effective functional preset for a given project.
 *
 * Resolution order (most specific wins):
 *   1. project_members.project_preset  (per-project override by Admin)
 *   2. workspace_members.workspace_preset  (workspace-level default)
 *   3. users.global_preset  (user-level global fallback)
 *   4. "no_access"  (preset was never assigned)
 *
 * ⚠ "no_access" is NOT a silent read-only state. It must render as a blocked
 *    UI with the message: "Your role has not been configured. Contact your
 *    workspace Admin."
 */
export async function resolvePreset(
	userId: string,
	projectId: string,
	workspaceId: string,
): Promise<ResolvedPreset> {
	// Step 1: Check project-level override
	const projectMember = await db.query.projectMembers.findFirst({
		where: and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
		columns: { projectPreset: true },
	});

	if (projectMember?.projectPreset) {
		return projectMember.projectPreset as ResolvedPreset;
	}

	// Step 2: Check workspace-level preset
	const workspaceMember = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, userId),
			eq(workspaceMembers.workspaceId, workspaceId),
			isNull(workspaceMembers.removedAt),
		),
		columns: { workspacePreset: true },
	});

	if (workspaceMember?.workspacePreset) {
		return workspaceMember.workspacePreset as ResolvedPreset;
	}

	// Step 3: Check user global preset
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
		columns: { globalPreset: true },
	});

	if (user?.globalPreset) {
		return user.globalPreset as ResolvedPreset;
	}

	// Step 4: No preset assigned anywhere
	return "no_access";
}
