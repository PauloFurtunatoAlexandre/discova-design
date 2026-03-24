"use server";

import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import slugify from "slugify";
import { z } from "zod";

function makeSlug(name: string) {
	const base = slugify(name, { lower: true, strict: true, trim: true }) || "workspace";
	return `${base}-${nanoid(4)}`;
}

export async function updateWorkspaceNameAction(
	workspaceId: string,
	name: string,
): Promise<{ error?: string; success?: boolean }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const parsed = z.string().min(1).max(64).safeParse(name.trim());
	if (!parsed.success) return { error: "Workspace name must be between 1 and 64 characters." };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, session.user.id),
			isNull(workspaceMembers.removedAt),
		),
	});
	if (!membership || membership.tier !== "admin") return { error: "Forbidden" };

	await db
		.update(workspaces)
		.set({ name: parsed.data, slug: makeSlug(parsed.data), updatedAt: new Date() })
		.where(eq(workspaces.id, workspaceId));

	return { success: true };
}

export async function createOnboardingProjectAction(
	workspaceId: string,
	name: string,
	description: string,
): Promise<{
	error?: string | undefined;
	success?: boolean | undefined;
	projectId?: string | undefined;
}> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const parsedName = z.string().min(1).max(100).safeParse(name.trim());
	if (!parsedName.success) return { error: "Project name must be between 1 and 100 characters." };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.workspaceId, workspaceId),
			eq(workspaceMembers.userId, session.user.id),
			isNull(workspaceMembers.removedAt),
		),
	});
	if (!membership) return { error: "Forbidden" };

	const [project] = await db
		.insert(projects)
		.values({
			workspaceId,
			name: parsedName.data,
			slug: makeSlug(parsedName.data),
			description: description.trim() || null,
			createdBy: session.user.id,
		})
		.returning({ id: projects.id });

	return { success: true, projectId: project?.id };
}
