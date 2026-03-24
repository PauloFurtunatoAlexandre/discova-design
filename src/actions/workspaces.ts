"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { requireAuth } from "@/lib/auth/helpers";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { isAdmin } from "@/lib/permissions";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { createWorkspaceSchema, updateWorkspaceSchema } from "@/lib/validations/workspaces";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Create Workspace ────────────────────────────────────────────────────────

export async function createWorkspaceAction(
	_prevState: unknown,
	formData: FormData,
): Promise<{
	success?: boolean;
	error?: string;
	fieldErrors?: Record<string, string[]>;
	workspaceId?: string;
}> {
	try {
		const user = await requireAuth();

		const raw = {
			name: formData.get("name"),
			logoUrl: formData.get("logoUrl") || undefined,
		};

		const parsed = createWorkspaceSchema.safeParse(raw);
		if (!parsed.success) {
			return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
		}

		const slug = await generateUniqueSlug(parsed.data.name);

		const [workspace] = await db
			.insert(workspaces)
			.values({
				name: parsed.data.name,
				slug,
				logoUrl: parsed.data.logoUrl || null,
				createdBy: user.id,
			})
			.returning({ id: workspaces.id, slug: workspaces.slug });

		if (!workspace) {
			return { error: "Failed to create workspace. Please try again." };
		}

		await db.insert(workspaceMembers).values({
			workspaceId: workspace.id,
			userId: user.id,
			tier: "admin",
			workspacePreset: "member",
			invitedBy: user.id,
			inviteAcceptedAt: new Date(),
		});

		await createAuditEntry({
			workspaceId: workspace.id,
			userId: user.id,
			action: "workspace.created",
			targetType: "workspace",
			targetId: workspace.id,
		});

		revalidatePath("/(app)", "layout");

		return { success: true, workspaceId: workspace.id };
	} catch (err) {
		logger.error({ err }, "Create workspace failed");
		return { error: "An unexpected error occurred." };
	}
}

// ─── Update Workspace ────────────────────────────────────────────────────────

export async function updateWorkspaceAction(
	workspaceId: string,
	_prevState: unknown,
	formData: FormData,
): Promise<{ success?: boolean; error?: string; fieldErrors?: Record<string, string[]> }> {
	try {
		const user = await requireAuth();

		const admin = await isAdmin(user.id, workspaceId);
		if (!admin) {
			return { error: "Only workspace Admins can update settings." };
		}

		const raw = {
			name: formData.get("name") || undefined,
			logoUrl: formData.get("logoUrl") || undefined,
		};

		const parsed = updateWorkspaceSchema.safeParse(raw);
		if (!parsed.success) {
			return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
		}

		const updates: Record<string, unknown> = { updatedAt: new Date() };
		if (parsed.data.name !== undefined) updates.name = parsed.data.name;
		if (parsed.data.logoUrl !== undefined) updates.logoUrl = parsed.data.logoUrl || null;

		await db.update(workspaces).set(updates).where(eq(workspaces.id, workspaceId));

		await createAuditEntry({
			workspaceId,
			userId: user.id,
			action: "workspace.updated",
			targetType: "workspace",
			targetId: workspaceId,
			metadata: { fields: Object.keys(updates).filter((k) => k !== "updatedAt") },
		});

		revalidatePath("/(app)", "layout");

		return { success: true };
	} catch (err) {
		logger.error({ err }, "Update workspace failed");
		return { error: "An unexpected error occurred." };
	}
}

// ─── Delete Workspace (Soft Delete) ─────────────────────────────────────────

export async function deleteWorkspaceAction(
	workspaceId: string,
): Promise<{ success?: boolean; error?: string }> {
	try {
		const user = await requireAuth();

		const admin = await isAdmin(user.id, workspaceId);
		if (!admin) {
			return { error: "Only workspace Admins can delete a workspace." };
		}

		// Must have at least 1 other non-demo workspace remaining
		const memberships = await db.query.workspaceMembers.findMany({
			where: and(eq(workspaceMembers.userId, user.id), isNull(workspaceMembers.removedAt)),
			with: { workspace: { columns: { isDemo: true } } },
			columns: { workspaceId: true },
		});

		const remainingNonDemo = memberships.filter(
			(m) => m.workspaceId !== workspaceId && !m.workspace.isDemo,
		);

		if (remainingNonDemo.length === 0) {
			return {
				error: "You cannot delete your last workspace. Create a new one first.",
			};
		}

		// Soft delete: remove all members (effectively kills access)
		await db
			.update(workspaceMembers)
			.set({ removedAt: new Date() })
			.where(
				and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)),
			);

		await createAuditEntry({
			workspaceId,
			userId: user.id,
			action: "workspace.deleted",
			targetType: "workspace",
			targetId: workspaceId,
		});

		revalidatePath("/(app)", "layout");

		return { success: true };
	} catch (err) {
		logger.error({ err }, "Delete workspace failed");
		return { error: "An unexpected error occurred." };
	}
}

// ─── Get User Workspaces (for switcher) ─────────────────────────────────────

export async function getUserWorkspaces() {
	const user = await requireAuth();

	const memberships = await db.query.workspaceMembers.findMany({
		where: and(eq(workspaceMembers.userId, user.id), isNull(workspaceMembers.removedAt)),
		with: { workspace: true },
		columns: { tier: true, workspaceId: true },
	});

	return memberships
		.filter((m) => m.workspace)
		.map((m) => ({
			id: m.workspace.id,
			name: m.workspace.name,
			slug: m.workspace.slug,
			logoUrl: m.workspace.logoUrl,
			isDemo: m.workspace.isDemo,
			tier: m.tier,
		}));
}
