"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, workspaceMembers } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { createProjectSchema, updateProjectSchema } from "@/lib/validations/projects";
import { and, eq, isNull } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import slugifyLib from "slugify";

// Lowercase-only suffix alphabet — consistent with workspace slug utility
const nanoidSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);
const nanoidSlugLong = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8);

function makeProjectSlug(name: string): string {
	const sanitized = name.replace(/[^a-zA-Z0-9\s'-]/g, " ").trim();
	const base = slugifyLib(sanitized, { lower: true, strict: true, trim: true }) || "project";
	return `${base}-${nanoidSlug()}`;
}

async function uniqueProjectSlug(workspaceId: string, name: string): Promise<string> {
	for (let i = 0; i < 5; i++) {
		const slug = makeProjectSlug(name);
		const existing = await db.query.projects.findFirst({
			where: and(eq(projects.workspaceId, workspaceId), eq(projects.slug, slug)),
			columns: { id: true },
		});
		if (!existing) return slug;
	}
	// Fallback with longer suffix
	const sanitized = name.replace(/[^a-zA-Z0-9\s'-]/g, " ").trim();
	const base = slugifyLib(sanitized, { lower: true, strict: true, trim: true }) || "project";
	return `${base}-${nanoidSlugLong()}`;
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createProjectAction(
	workspaceId: string,
	_prevState: unknown,
	formData: FormData,
): Promise<{
	success?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[]>;
	projectId?: string;
}> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	// Verify workspace membership — viewers cannot create projects
	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, workspaceId),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) return { error: "You do not have access to this workspace" };
	if (membership.tier === "viewer") return { error: "Viewers cannot create projects" };

	// Validate input
	const parsed = createProjectSchema.safeParse({
		name: formData.get("name"),
		description: formData.get("description") ?? undefined,
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	const { name, description } = parsed.data;
	const slug = await uniqueProjectSlug(workspaceId, name);

	const [project] = await db
		.insert(projects)
		.values({
			workspaceId,
			name,
			slug,
			description: description || null,
			createdBy: session.user.id,
		})
		.returning({ id: projects.id });

	if (!project) {
		logger.error({ workspaceId, name }, "createProjectAction: insert returned no rows");
		return { error: "Failed to create project. Please try again." };
	}

	void createAuditEntry({
		workspaceId,
		userId: session.user.id,
		action: "project.created",
		targetType: "project",
		targetId: project.id,
		metadata: { name, slug },
	});

	revalidatePath(`/${workspaceId}`, "layout");

	return { success: true, projectId: project.id };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateProjectAction(
	projectId: string,
	_prevState: unknown,
	formData: FormData,
): Promise<{
	success?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[]>;
}> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	// Fetch project to get workspaceId and createdBy
	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	});

	if (!project) return { error: "Project not found" };

	// Verify workspace membership
	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, project.workspaceId),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) return { error: "You do not have access to this workspace" };

	// Only creator or admin can rename
	if (project.createdBy !== session.user.id && membership.tier !== "admin") {
		return { error: "Only the project creator or an admin can rename this project" };
	}

	// Validate input
	const parsed = updateProjectSchema.safeParse({
		name: formData.get("name") ?? undefined,
		description: formData.get("description") ?? undefined,
	});

	if (!parsed.success) {
		return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
	}

	await db
		.update(projects)
		.set({
			name: parsed.data.name ?? project.name,
			description:
				parsed.data.description !== undefined
					? parsed.data.description || null
					: project.description,
			updatedAt: new Date(),
		})
		.where(eq(projects.id, projectId));

	void createAuditEntry({
		workspaceId: project.workspaceId,
		userId: session.user.id,
		action: "project.updated",
		targetType: "project",
		targetId: projectId,
		metadata: { name: parsed.data.name },
	});

	revalidatePath(`/${project.workspaceId}`, "layout");

	return { success: true };
}

// ─── Archive ──────────────────────────────────────────────────────────────────

export async function archiveProjectAction(
	projectId: string,
): Promise<{ success?: boolean; error?: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	});

	if (!project) return { error: "Project not found" };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, project.workspaceId),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) return { error: "You do not have access to this workspace" };
	if (membership.tier !== "admin") return { error: "Only admins can archive projects" };

	await db.update(projects).set({ archivedAt: new Date() }).where(eq(projects.id, projectId));

	void createAuditEntry({
		workspaceId: project.workspaceId,
		userId: session.user.id,
		action: "project.archived",
		targetType: "project",
		targetId: projectId,
	});

	revalidatePath(`/${project.workspaceId}`, "layout");

	return { success: true };
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restoreProjectAction(
	projectId: string,
): Promise<{ success?: boolean; error?: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Unauthorized" };

	const project = await db.query.projects.findFirst({
		where: eq(projects.id, projectId),
	});

	if (!project) return { error: "Project not found" };

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, project.workspaceId),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) return { error: "You do not have access to this workspace" };
	if (membership.tier !== "admin") return { error: "Only admins can restore projects" };

	await db.update(projects).set({ archivedAt: null }).where(eq(projects.id, projectId));

	void createAuditEntry({
		workspaceId: project.workspaceId,
		userId: session.user.id,
		action: "project.restored",
		targetType: "project",
		targetId: projectId,
	});

	revalidatePath(`/${project.workspaceId}`, "layout");

	return { success: true };
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getWorkspaceProjects(workspaceId: string) {
	const session = await auth();
	if (!session?.user?.id) return [];

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, workspaceId),
			isNull(workspaceMembers.removedAt),
		),
		columns: { id: true },
	});

	if (!membership) return [];

	return db.query.projects.findMany({
		where: and(eq(projects.workspaceId, workspaceId), isNull(projects.archivedAt)),
		orderBy: (p, { desc }) => [desc(p.createdAt)],
	});
}
