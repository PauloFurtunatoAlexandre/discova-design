import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workspaceMembers, projects } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { logger } from "@/lib/logger";

export async function getCurrentSession() {
	return await auth();
}

export async function getCurrentUser() {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login");
	}

	return session.user;
}

export async function requireAuth() {
	const session = await auth();

	if (!session?.user?.id) {
		throw new Error("Authentication required");
	}

	return session.user;
}

export async function requireWorkspaceAccess(workspaceId: string) {
	const user = await requireAuth();

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, user.id),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) {
		logger.warn({ userId: user.id, workspaceId }, "Workspace access denied — not a member");
		throw new Error("You do not have access to this workspace");
	}

	return { user, membership };
}

export async function requireProjectAccess(projectId: string) {
	const user = await requireAuth();

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	});

	if (!project) {
		throw new Error("Project not found");
	}

	const { membership } = await requireWorkspaceAccess(project.workspaceId);

	return { user, membership, project };
}
