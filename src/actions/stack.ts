"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { stackItems } from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import { syncSolutionNodesToStack } from "@/lib/queries/stack";
import { calculateRiceScore } from "@/lib/utils/rice";
import { updateRiceFieldSchema, updateTierSchema } from "@/lib/validations/stack";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Update RICE Field ──────────────────────────────────────────────────────────

export const updateRiceFieldAction = withPermission(
	{ phase: "stack", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			stackItemId: string;
			field: "reachOverride" | "impactOverride" | "confidenceOverride" | "effortManual";
			value: number | null;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = updateRiceFieldSchema.safeParse({
			stackItemId: args.stackItemId,
			field: args.field,
			value: args.value,
		});
		if (!parsed.success) {
			return { error: "Invalid input" };
		}

		// IDOR: verify item belongs to project
		const [item] = await db
			.select({
				id: stackItems.id,
				reachAuto: stackItems.reachAuto,
				reachOverride: stackItems.reachOverride,
				impactAuto: stackItems.impactAuto,
				impactOverride: stackItems.impactOverride,
				confidenceAuto: stackItems.confidenceAuto,
				confidenceOverride: stackItems.confidenceOverride,
				effortManual: stackItems.effortManual,
			})
			.from(stackItems)
			.where(
				and(eq(stackItems.id, parsed.data.stackItemId), eq(stackItems.projectId, ctx.projectId)),
			)
			.limit(1);

		if (!item) {
			return { error: "Stack item not found in this project" };
		}

		// Build updated fields
		const updateData: Record<string, unknown> = {
			[parsed.data.field]: parsed.data.value,
			lastEditedBy: ctx.userId,
			updatedAt: new Date(),
		};

		// Recalculate RICE score with the new value applied
		const updated = { ...item, [parsed.data.field]: parsed.data.value };
		const reach = updated.reachOverride ?? updated.reachAuto;
		const impact = updated.impactOverride ?? updated.impactAuto;
		const confidence = updated.confidenceOverride ?? updated.confidenceAuto;
		const effort = updated.effortManual;

		updateData.riceScore = calculateRiceScore({ reach, impact, confidence, effort });

		await db
			.update(stackItems)
			.set(updateData)
			.where(
				and(eq(stackItems.id, parsed.data.stackItemId), eq(stackItems.projectId, ctx.projectId)),
			);

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "stack.rice.updated",
			targetType: "stack_item",
			targetId: parsed.data.stackItemId,
			metadata: { field: parsed.data.field, value: parsed.data.value },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/stack`, "page");

		return { success: true };
	},
);

// ─── Update Tier ─────────────────────────────────────────────────────────────────

export const updateTierAction = withPermission(
	{ phase: "stack", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			stackItemId: string;
			tier: "now" | "next" | "later" | "someday" | null;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = updateTierSchema.safeParse({
			stackItemId: args.stackItemId,
			tier: args.tier,
		});
		if (!parsed.success) {
			return { error: "Invalid input" };
		}

		// IDOR: verify item belongs to project
		const [item] = await db
			.select({ id: stackItems.id })
			.from(stackItems)
			.where(
				and(eq(stackItems.id, parsed.data.stackItemId), eq(stackItems.projectId, ctx.projectId)),
			)
			.limit(1);

		if (!item) {
			return { error: "Stack item not found in this project" };
		}

		await db
			.update(stackItems)
			.set({
				tier: parsed.data.tier,
				lastEditedBy: ctx.userId,
				updatedAt: new Date(),
			})
			.where(
				and(eq(stackItems.id, parsed.data.stackItemId), eq(stackItems.projectId, ctx.projectId)),
			);

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "stack.tier.updated",
			targetType: "stack_item",
			targetId: parsed.data.stackItemId,
			metadata: { tier: parsed.data.tier },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/stack`, "page");

		return { success: true };
	},
);

// ─── Sync Stack Items ────────────────────────────────────────────────────────────

export const syncStackItemsAction = withPermission(
	{ phase: "stack", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
		},
	): Promise<{ success: true; newItems: number } | { error: string }> => {
		const newItems = await syncSolutionNodesToStack(ctx.projectId);

		if (newItems > 0) {
			createAuditEntry({
				workspaceId: ctx.workspaceId,
				userId: ctx.userId,
				action: "stack.synced",
				targetType: "project",
				targetId: ctx.projectId,
				metadata: { newItems },
			}).catch(() => {});

			revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/stack`, "page");
		}

		return { success: true, newItems };
	},
);
