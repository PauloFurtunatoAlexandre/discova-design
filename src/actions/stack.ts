"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { stackItems, stackSnapshots } from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import { getStackItems, syncSolutionNodesToStack } from "@/lib/queries/stack";
import { calculateRiceScore } from "@/lib/utils/rice";
import {
	lockStackSchema,
	unlockStackSchema,
	updateRiceFieldSchema,
	updateTierSchema,
} from "@/lib/validations/stack";
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

// ─── Passcode hashing helpers ────────────────────────────────────────────────

function hashPasscode(passcode: string): string {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(passcode, salt, 64).toString("hex");
	return `${salt}:${hash}`;
}

function verifyPasscode(passcode: string, stored: string): boolean {
	const [salt, hash] = stored.split(":");
	if (!salt || !hash) return false;
	const computed = scryptSync(passcode, salt, 64);
	return timingSafeEqual(Buffer.from(hash, "hex"), computed);
}

// ─── Lock Stack (create snapshot) ────────────────────────────────────────────

export const lockStackAction = withPermission(
	{ phase: "stack", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			passcode: string;
			viewMode: "stakeholder" | "presentation";
		},
	): Promise<{ success: true; snapshotId: string; shareToken: string } | { error: string }> => {
		const parsed = lockStackSchema.safeParse({
			passcode: args.passcode,
			viewMode: args.viewMode,
		});
		if (!parsed.success) {
			return {
				error: parsed.error.errors[0]?.message ?? "Invalid input",
			};
		}

		// Check if already locked
		const existing = await db
			.select({ id: stackSnapshots.id })
			.from(stackSnapshots)
			.where(eq(stackSnapshots.projectId, ctx.projectId))
			.limit(1);

		if (existing.length > 0) {
			return { error: "Stack is already locked. Unlock it first." };
		}

		// Fetch current stack items to snapshot
		const items = await getStackItems(ctx.projectId, "rice_desc");

		// Generate share token and hash passcode
		const shareToken = randomBytes(24).toString("base64url");
		const passcodeHash = hashPasscode(parsed.data.passcode);

		const [snapshot] = await db
			.insert(stackSnapshots)
			.values({
				projectId: ctx.projectId,
				lockedBy: ctx.userId,
				lockedAt: new Date(),
				snapshotData: items,
				sharePasscodeHash: passcodeHash,
				shareViewMode: parsed.data.viewMode,
				shareToken,
			})
			.returning({ id: stackSnapshots.id });

		if (!snapshot) {
			return { error: "Failed to create snapshot" };
		}

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "stack.locked",
			targetType: "stack_snapshot",
			targetId: snapshot.id,
			metadata: { viewMode: parsed.data.viewMode, itemCount: items.length },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/stack`, "page");

		return { success: true, snapshotId: snapshot.id, shareToken };
	},
);

// ─── Unlock Stack (delete snapshot) ──────────────────────────────────────────

export const unlockStackAction = withPermission(
	{ phase: "stack", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			snapshotId: string;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = unlockStackSchema.safeParse({
			snapshotId: args.snapshotId,
		});
		if (!parsed.success) {
			return { error: "Invalid snapshot ID" };
		}

		// IDOR: verify snapshot belongs to project
		const [snapshot] = await db
			.select({ id: stackSnapshots.id, lockedBy: stackSnapshots.lockedBy })
			.from(stackSnapshots)
			.where(
				and(
					eq(stackSnapshots.id, parsed.data.snapshotId),
					eq(stackSnapshots.projectId, ctx.projectId),
				),
			)
			.limit(1);

		if (!snapshot) {
			return { error: "Snapshot not found in this project" };
		}

		// Only the person who locked or an admin can unlock
		if (snapshot.lockedBy !== ctx.userId && ctx.tier !== "admin") {
			return { error: "Only the person who locked the stack or an admin can unlock it" };
		}

		await db
			.delete(stackSnapshots)
			.where(
				and(
					eq(stackSnapshots.id, parsed.data.snapshotId),
					eq(stackSnapshots.projectId, ctx.projectId),
				),
			);

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "stack.unlocked",
			targetType: "stack_snapshot",
			targetId: parsed.data.snapshotId,
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/stack`, "page");

		return { success: true };
	},
);

// ─── Verify share passcode (public, no auth required) ────────────────────────

export async function verifySharePasscode(
	token: string,
	passcode: string,
): Promise<{ valid: boolean; snapshotData?: unknown; viewMode?: string }> {
	const [snapshot] = await db
		.select({
			sharePasscodeHash: stackSnapshots.sharePasscodeHash,
			snapshotData: stackSnapshots.snapshotData,
			shareViewMode: stackSnapshots.shareViewMode,
		})
		.from(stackSnapshots)
		.where(eq(stackSnapshots.shareToken, token))
		.limit(1);

	if (!snapshot) {
		return { valid: false };
	}

	if (!verifyPasscode(passcode, snapshot.sharePasscodeHash)) {
		return { valid: false };
	}

	return {
		valid: true,
		snapshotData: snapshot.snapshotData,
		viewMode: snapshot.shareViewMode,
	};
}
