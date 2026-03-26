"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { mapConnections, mapNodes } from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import {
	createConnectionSchema,
	createMapNodeSchema,
	deleteConnectionSchema,
	deleteMapNodeSchema,
	updateNodePositionSchema,
} from "@/lib/validations/map";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Create Map Node (Problem or Solution) ───────────────────────────────────

export const createMapNodeAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			type: "problem" | "solution";
			label: string;
			description: string | null;
		},
	): Promise<
		{ success: true; nodeId: string } | { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		const parsed = createMapNodeSchema.safeParse({
			type: args.type,
			label: args.label,
			description: args.description,
		});
		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		const [node] = await db
			.insert(mapNodes)
			.values({
				projectId: ctx.projectId,
				type: parsed.data.type,
				label: parsed.data.label,
				description: parsed.data.description,
				positionX: 0,
				positionY: 0,
				createdBy: ctx.userId,
			})
			.returning({ id: mapNodes.id });

		if (!node) {
			return { error: "Failed to create node" };
		}

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "map.node.created",
			targetType: "map_node",
			targetId: node.id,
			metadata: { type: parsed.data.type, label: parsed.data.label.slice(0, 100) },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true, nodeId: node.id };
	},
);

// ─── Create Connection ────────────────────────────────────────────────────────

export const createConnectionAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			sourceNodeId: string;
			targetNodeId: string;
		},
	): Promise<{ success: true; connectionId: string } | { error: string }> => {
		const parsed = createConnectionSchema.safeParse({
			sourceNodeId: args.sourceNodeId,
			targetNodeId: args.targetNodeId,
		});
		if (!parsed.success) {
			return { error: "Invalid connection data" };
		}

		if (parsed.data.sourceNodeId === parsed.data.targetNodeId) {
			return { error: "Cannot connect a node to itself" };
		}

		// IDOR: verify both nodes belong to this project
		const [source] = await db
			.select({ id: mapNodes.id, type: mapNodes.type })
			.from(mapNodes)
			.where(and(eq(mapNodes.id, parsed.data.sourceNodeId), eq(mapNodes.projectId, ctx.projectId)))
			.limit(1);

		const [target] = await db
			.select({ id: mapNodes.id, type: mapNodes.type })
			.from(mapNodes)
			.where(and(eq(mapNodes.id, parsed.data.targetNodeId), eq(mapNodes.projectId, ctx.projectId)))
			.limit(1);

		if (!source || !target) {
			return { error: "One or both nodes not found in this project" };
		}

		// Validate connection direction: insight→problem, problem→solution, insight→solution
		const validConnections: Record<string, string[]> = {
			insight: ["problem", "solution"],
			problem: ["solution"],
		};
		const allowed = validConnections[source.type];
		if (!allowed?.includes(target.type)) {
			return {
				error: `Cannot connect ${source.type} to ${target.type}. Valid: Insight→Problem, Insight→Solution, Problem→Solution`,
			};
		}

		const [connection] = await db
			.insert(mapConnections)
			.values({
				projectId: ctx.projectId,
				sourceNodeId: parsed.data.sourceNodeId,
				targetNodeId: parsed.data.targetNodeId,
				createdBy: ctx.userId,
			})
			.onConflictDoNothing()
			.returning({ id: mapConnections.id });

		if (!connection) {
			return { error: "Connection already exists" };
		}

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "map.connection.created",
			targetType: "map_connection",
			targetId: connection.id,
			metadata: {
				sourceNodeId: parsed.data.sourceNodeId,
				targetNodeId: parsed.data.targetNodeId,
			},
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true, connectionId: connection.id };
	},
);

// ─── Delete Map Node ──────────────────────────────────────────────────────────

export const deleteMapNodeAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			nodeId: string;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = deleteMapNodeSchema.safeParse({ nodeId: args.nodeId });
		if (!parsed.success) {
			return { error: "Invalid node ID" };
		}

		// IDOR: verify node belongs to this project
		const [node] = await db
			.select({ id: mapNodes.id, createdBy: mapNodes.createdBy, type: mapNodes.type })
			.from(mapNodes)
			.where(and(eq(mapNodes.id, parsed.data.nodeId), eq(mapNodes.projectId, ctx.projectId)))
			.limit(1);

		if (!node) {
			return { error: "Node not found in this project" };
		}

		// Only creator or admin can delete
		if (node.createdBy !== ctx.userId && ctx.tier !== "admin") {
			return { error: "You can only delete nodes you created" };
		}

		// CASCADE on map_connections will remove related connections
		await db
			.delete(mapNodes)
			.where(and(eq(mapNodes.id, parsed.data.nodeId), eq(mapNodes.projectId, ctx.projectId)));

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "map.node.deleted",
			targetType: "map_node",
			targetId: parsed.data.nodeId,
			metadata: { type: node.type },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true };
	},
);

// ─── Delete Connection ────────────────────────────────────────────────────────

export const deleteConnectionAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			connectionId: string;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = deleteConnectionSchema.safeParse({ connectionId: args.connectionId });
		if (!parsed.success) {
			return { error: "Invalid connection ID" };
		}

		const [conn] = await db
			.select({ id: mapConnections.id })
			.from(mapConnections)
			.where(
				and(
					eq(mapConnections.id, parsed.data.connectionId),
					eq(mapConnections.projectId, ctx.projectId),
				),
			)
			.limit(1);

		if (!conn) {
			return { error: "Connection not found in this project" };
		}

		await db
			.delete(mapConnections)
			.where(
				and(
					eq(mapConnections.id, parsed.data.connectionId),
					eq(mapConnections.projectId, ctx.projectId),
				),
			);

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "map.connection.deleted",
			targetType: "map_connection",
			targetId: parsed.data.connectionId,
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true };
	},
);

// ─── Update Node Position (drag) ──────────────────────────────────────────────

export const updateNodePositionAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			nodeId: string;
			positionX: number;
			positionY: number;
		},
	): Promise<{ success: true } | { error: string }> => {
		const parsed = updateNodePositionSchema.safeParse({
			nodeId: args.nodeId,
			positionX: args.positionX,
			positionY: args.positionY,
		});
		if (!parsed.success) {
			return { error: "Invalid position data" };
		}

		const updated = await db
			.update(mapNodes)
			.set({
				positionX: parsed.data.positionX,
				positionY: parsed.data.positionY,
				updatedAt: new Date(),
			})
			.where(and(eq(mapNodes.id, parsed.data.nodeId), eq(mapNodes.projectId, ctx.projectId)))
			.returning({ id: mapNodes.id });

		if (updated.length === 0) {
			return { error: "Node not found in this project" };
		}

		// No revalidation for position updates — handled client-side optimistically

		return { success: true };
	},
);

// ─── Place Insight on Map ─────────────────────────────────────────────────────

export const placeInsightOnMapAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			insightId: string;
		},
	): Promise<{ success: true; nodeId: string } | { error: string }> => {
		// Check if insight already has a map node
		const [existing] = await db
			.select({ id: mapNodes.id })
			.from(mapNodes)
			.where(and(eq(mapNodes.insightId, args.insightId), eq(mapNodes.projectId, ctx.projectId)))
			.limit(1);

		if (existing) {
			return { error: "This insight is already on the map" };
		}

		// Verify insight belongs to project
		const { insightCards } = await import("@/lib/db/schema");
		const [insight] = await db
			.select({ id: insightCards.id, statement: insightCards.statement })
			.from(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)))
			.limit(1);

		if (!insight) {
			return { error: "Insight not found in this project" };
		}

		const [node] = await db
			.insert(mapNodes)
			.values({
				projectId: ctx.projectId,
				type: "insight",
				label: insight.statement.slice(0, 100),
				insightId: args.insightId,
				positionX: 0,
				positionY: 0,
				createdBy: ctx.userId,
			})
			.returning({ id: mapNodes.id });

		if (!node) {
			return { error: "Failed to place insight on map" };
		}

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "map.insight.placed",
			targetType: "map_node",
			targetId: node.id,
			metadata: { insightId: args.insightId },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true, nodeId: node.id };
	},
);
