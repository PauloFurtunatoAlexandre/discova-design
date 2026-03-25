"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import {
	insightCards,
	insightEvidence,
	mapConnections,
	mapNodes,
	quotes,
	researchNotes,
} from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import {
	acceptInsightSchema,
	createManualInsightSchema,
	createProblemSchema,
	updateInsightSchema,
} from "@/lib/validations/insights";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Accept Insight ───────────────────────────────────────────────────────────

export const acceptInsightAction = withPermission(
	{ phase: "engine", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			noteId: string;
			statement: string;
			themeTag: string | null;
			isAiGenerated: boolean;
			evidenceQuoteIds: string[];
			evidenceSpans: Array<{
				quoteText: string;
				startOffset: number;
				endOffset: number;
			}>;
			problemNodeId: string | null;
		},
	): Promise<
		{ success: true; insightId: string } | { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate
		const parsed = acceptInsightSchema.safeParse({
			statement: args.statement,
			themeTag: args.themeTag,
			isAiGenerated: args.isAiGenerated,
			evidenceQuoteIds: args.evidenceQuoteIds,
			problemNodeId: args.problemNodeId,
		});
		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		const data = parsed.data;

		// 2. IDOR: verify evidenceQuoteIds belong to this project
		if (data.evidenceQuoteIds.length > 0) {
			const verified = await db
				.select({ id: quotes.id })
				.from(quotes)
				.innerJoin(researchNotes, eq(quotes.noteId, researchNotes.id))
				.where(
					and(
						inArray(quotes.id, data.evidenceQuoteIds),
						eq(researchNotes.projectId, ctx.projectId),
					),
				);
			if (verified.length !== data.evidenceQuoteIds.length) {
				return { error: "One or more quotes do not belong to this project" };
			}
		}

		// 3. IDOR: verify problemNodeId belongs to this project
		if (data.problemNodeId) {
			const [node] = await db
				.select({ id: mapNodes.id })
				.from(mapNodes)
				.where(
					and(
						eq(mapNodes.id, data.problemNodeId),
						eq(mapNodes.type, "problem"),
						eq(mapNodes.projectId, ctx.projectId),
					),
				)
				.limit(1);
			if (!node) {
				return { error: "Problem node not found in this project" };
			}
		}

		// 4. Create insight card
		const [newInsight] = await db
			.insert(insightCards)
			.values({
				projectId: ctx.projectId,
				statement: data.statement,
				confidenceScore: 0,
				themeTag: data.themeTag,
				isAiGenerated: data.isAiGenerated,
				createdBy: ctx.userId,
				acceptedBy: data.isAiGenerated ? ctx.userId : null,
			})
			.returning({ id: insightCards.id });

		if (!newInsight) {
			return { error: "Failed to create insight card" };
		}

		// 5. Link explicitly provided evidence quotes
		const linkedQuoteIds = new Set<string>();
		for (const quoteId of data.evidenceQuoteIds) {
			await db
				.insert(insightEvidence)
				.values({ insightId: newInsight.id, quoteId })
				.onConflictDoNothing();
			linkedQuoteIds.add(quoteId);
		}

		// 6. Auto-create or reuse quotes from AI evidence spans
		for (const span of args.evidenceSpans) {
			const [existing] = await db
				.select({ id: quotes.id })
				.from(quotes)
				.where(and(eq(quotes.noteId, args.noteId), eq(quotes.text, span.quoteText)))
				.limit(1);

			let quoteId: string;

			if (existing) {
				if (linkedQuoteIds.has(existing.id)) continue;
				quoteId = existing.id;
			} else {
				const [newQuote] = await db
					.insert(quotes)
					.values({
						noteId: args.noteId,
						text: span.quoteText,
						startOffset: span.startOffset,
						endOffset: span.endOffset,
						createdBy: ctx.userId,
					})
					.returning({ id: quotes.id });
				if (!newQuote) continue;
				quoteId = newQuote.id;
			}

			await db
				.insert(insightEvidence)
				.values({ insightId: newInsight.id, quoteId })
				.onConflictDoNothing();
			linkedQuoteIds.add(quoteId);
		}

		// 7. If problemNodeId: create insight map node + connection
		if (data.problemNodeId) {
			const insightNodeId = await ensureInsightMapNode(
				ctx.projectId,
				ctx.userId,
				newInsight.id,
				data.statement,
			);
			await db
				.insert(mapConnections)
				.values({
					projectId: ctx.projectId,
					sourceNodeId: insightNodeId,
					targetNodeId: data.problemNodeId,
					createdBy: ctx.userId,
				})
				.onConflictDoNothing();
		}

		// 8. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: data.isAiGenerated ? "insight.accepted" : "insight.created",
			targetType: "insight_card",
			targetId: newInsight.id,
			metadata: {
				statement: data.statement.slice(0, 100),
				isAiGenerated: data.isAiGenerated,
			},
		}).catch(() => {});

		// 9. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/engine`, "page");
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/vault`, "page");

		return { success: true, insightId: newInsight.id };
	},
);

// ─── Link Insight to Existing Problem ────────────────────────────────────────

export const linkInsightToProblemAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			insightId: string;
			problemNodeId: string;
		},
	): Promise<{ success: true; insightNodeId: string } | { error: string }> => {
		// IDOR: verify problem node belongs to this project
		const [problem] = await db
			.select({ id: mapNodes.id })
			.from(mapNodes)
			.where(
				and(
					eq(mapNodes.id, args.problemNodeId),
					eq(mapNodes.type, "problem"),
					eq(mapNodes.projectId, ctx.projectId),
				),
			)
			.limit(1);
		if (!problem) {
			return { error: "Problem node not found in this project" };
		}

		// Verify insight belongs to this project
		const [insight] = await db
			.select({ id: insightCards.id, statement: insightCards.statement })
			.from(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)))
			.limit(1);
		if (!insight) {
			return { error: "Insight not found in this project" };
		}

		// Ensure insight has a map node
		const insightNodeId = await ensureInsightMapNode(
			ctx.projectId,
			ctx.userId,
			insight.id,
			insight.statement,
		);

		// Create connection (idempotent)
		await db
			.insert(mapConnections)
			.values({
				projectId: ctx.projectId,
				sourceNodeId: insightNodeId,
				targetNodeId: args.problemNodeId,
				createdBy: ctx.userId,
			})
			.onConflictDoNothing();

		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "insight.linked",
			targetType: "map_connection",
			targetId: insightNodeId,
			metadata: { insightId: insight.id, problemNodeId: args.problemNodeId },
		}).catch(() => {});

		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true, insightNodeId };
	},
);

// ─── Create Problem Node and Link ─────────────────────────────────────────────

export const createProblemAndLinkAction = withPermission(
	{ phase: "map", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			insightId: string;
			problemLabel: string;
			problemDescription: string | null;
		},
	): Promise<
		| { success: true; problemNodeId: string; insightNodeId: string }
		| { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate
		const parsed = createProblemSchema.safeParse({
			label: args.problemLabel,
			description: args.problemDescription,
		});
		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		// 2. Verify insight belongs to this project
		const [insight] = await db
			.select({ id: insightCards.id, statement: insightCards.statement })
			.from(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)))
			.limit(1);
		if (!insight) {
			return { error: "Insight not found in this project" };
		}

		// 3. Create problem node
		const [problemNode] = await db
			.insert(mapNodes)
			.values({
				projectId: ctx.projectId,
				type: "problem",
				label: parsed.data.label,
				description: parsed.data.description,
				positionX: 0,
				positionY: 0,
				createdBy: ctx.userId,
			})
			.returning({ id: mapNodes.id });

		if (!problemNode) {
			return { error: "Failed to create problem node" };
		}

		// 4. Ensure insight map node exists
		const insightNodeId = await ensureInsightMapNode(
			ctx.projectId,
			ctx.userId,
			insight.id,
			insight.statement,
		);

		// 5. Create connection
		await db
			.insert(mapConnections)
			.values({
				projectId: ctx.projectId,
				sourceNodeId: insightNodeId,
				targetNodeId: problemNode.id,
				createdBy: ctx.userId,
			})
			.onConflictDoNothing();

		// 6. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "problem.created",
			targetType: "map_node",
			targetId: problemNode.id,
			metadata: { label: parsed.data.label, insightId: insight.id },
		}).catch(() => {});
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "insight.linked",
			targetType: "map_connection",
			targetId: insightNodeId,
			metadata: { insightId: insight.id, problemNodeId: problemNode.id },
		}).catch(() => {});

		// 7. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/engine`, "page");

		return { success: true, problemNodeId: problemNode.id, insightNodeId };
	},
);

// ─── Create Manual Insight ────────────────────────────────────────────────────

export const createManualInsightAction = withPermission(
	{ phase: "engine", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			statement: string;
			themeTag: string | null;
			evidenceQuoteIds: string[];
			problemNodeId: string | null;
		},
	): Promise<
		{ success: true; insightId: string } | { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate
		const parsed = createManualInsightSchema.safeParse({
			statement: args.statement,
			themeTag: args.themeTag,
			evidenceQuoteIds: args.evidenceQuoteIds,
			problemNodeId: args.problemNodeId,
		});
		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		const data = parsed.data;

		// 2. IDOR: verify evidenceQuoteIds belong to this project
		if (data.evidenceQuoteIds.length > 0) {
			const verified = await db
				.select({ id: quotes.id })
				.from(quotes)
				.innerJoin(researchNotes, eq(quotes.noteId, researchNotes.id))
				.where(
					and(
						inArray(quotes.id, data.evidenceQuoteIds),
						eq(researchNotes.projectId, ctx.projectId),
					),
				);
			if (verified.length !== data.evidenceQuoteIds.length) {
				return { error: "One or more quotes do not belong to this project" };
			}
		}

		// 3. IDOR: verify problemNodeId belongs to this project
		if (data.problemNodeId) {
			const [node] = await db
				.select({ id: mapNodes.id })
				.from(mapNodes)
				.where(
					and(
						eq(mapNodes.id, data.problemNodeId),
						eq(mapNodes.type, "problem"),
						eq(mapNodes.projectId, ctx.projectId),
					),
				)
				.limit(1);
			if (!node) {
				return { error: "Problem node not found in this project" };
			}
		}

		// 4. Create insight card (manual — not AI generated)
		const [newInsight] = await db
			.insert(insightCards)
			.values({
				projectId: ctx.projectId,
				statement: data.statement,
				confidenceScore: 0,
				themeTag: data.themeTag,
				isAiGenerated: false,
				createdBy: ctx.userId,
				acceptedBy: null,
			})
			.returning({ id: insightCards.id });

		if (!newInsight) {
			return { error: "Failed to create insight card" };
		}

		// 5. Link evidence quotes
		for (const quoteId of data.evidenceQuoteIds) {
			await db
				.insert(insightEvidence)
				.values({ insightId: newInsight.id, quoteId })
				.onConflictDoNothing();
		}

		// 6. If problemNodeId: create insight map node + connection
		if (data.problemNodeId) {
			const insightNodeId = await ensureInsightMapNode(
				ctx.projectId,
				ctx.userId,
				newInsight.id,
				data.statement,
			);
			await db
				.insert(mapConnections)
				.values({
					projectId: ctx.projectId,
					sourceNodeId: insightNodeId,
					targetNodeId: data.problemNodeId,
					createdBy: ctx.userId,
				})
				.onConflictDoNothing();
		}

		// 7. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "insight.created",
			targetType: "insight_card",
			targetId: newInsight.id,
			metadata: { statement: data.statement.slice(0, 100), isAiGenerated: false },
		}).catch(() => {});

		// 8. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/engine`, "page");
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/vault`, "page");

		return { success: true, insightId: newInsight.id };
	},
);

// ─── Update Insight ────────────────────────────────────────────────────────────

export const updateInsightAction = withPermission(
	{ phase: "engine", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			insightId: string;
			statement?: string | undefined;
			themeTag?: string | undefined;
		},
	): Promise<
		{ success: true; insightId: string } | { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate
		const parsed = updateInsightSchema.safeParse({
			insightId: args.insightId,
			statement: args.statement,
			themeTag: args.themeTag,
		});
		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		// 2. Verify insight belongs to project + get creator
		const [insight] = await db
			.select({ id: insightCards.id, createdBy: insightCards.createdBy })
			.from(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)))
			.limit(1);

		if (!insight) return { error: "Insight not found in this project" };

		// 3. Verify creator or Admin
		if (insight.createdBy !== ctx.userId && ctx.tier !== "admin") {
			return { error: "You can only edit insights you created" };
		}

		// 4. Build update set (only include provided fields)
		const updateSet: { statement?: string; themeTag?: string | null; updatedAt: Date } = {
			updatedAt: new Date(),
		};
		if (parsed.data.statement !== undefined) updateSet.statement = parsed.data.statement;
		if (parsed.data.themeTag !== undefined) updateSet.themeTag = parsed.data.themeTag;

		await db.update(insightCards).set(updateSet).where(eq(insightCards.id, args.insightId));

		// 5. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "insight.updated",
			targetType: "insight_card",
			targetId: args.insightId,
			metadata: { statement: (parsed.data.statement ?? "").slice(0, 100) },
		}).catch(() => {});

		// 6. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/engine`, "page");

		return { success: true, insightId: args.insightId };
	},
);

// ─── Delete Insight ────────────────────────────────────────────────────────────

export const deleteInsightAction = withPermission(
	{ phase: "engine", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			insightId: string;
		},
	): Promise<{ success: true } | { error: string }> => {
		// 1. Verify insight belongs to project + get creator
		const [insight] = await db
			.select({ id: insightCards.id, createdBy: insightCards.createdBy })
			.from(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)))
			.limit(1);

		if (!insight) return { error: "Insight not found in this project" };

		// 2. Verify creator or Admin
		if (insight.createdBy !== ctx.userId && ctx.tier !== "admin") {
			return { error: "You can only delete insights you created" };
		}

		// 3. Delete associated map nodes (CASCADE removes connections)
		//    mapNodes.insightId has onDelete: "set null" — we want full removal
		await db
			.delete(mapNodes)
			.where(and(eq(mapNodes.insightId, args.insightId), eq(mapNodes.projectId, ctx.projectId)));

		// 4. Delete the insight card (CASCADE removes insightEvidence rows)
		await db
			.delete(insightCards)
			.where(and(eq(insightCards.id, args.insightId), eq(insightCards.projectId, ctx.projectId)));

		// 5. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "insight.deleted",
			targetType: "insight_card",
			targetId: args.insightId,
		}).catch(() => {});

		// 6. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/engine`, "page");
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/map`, "page");

		return { success: true };
	},
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns existing insight map node ID, or creates one. */
async function ensureInsightMapNode(
	projectId: string,
	userId: string,
	insightId: string,
	statement: string,
): Promise<string> {
	const [existing] = await db
		.select({ id: mapNodes.id })
		.from(mapNodes)
		.where(and(eq(mapNodes.insightId, insightId), eq(mapNodes.projectId, projectId)))
		.limit(1);

	if (existing) return existing.id;

	const [created] = await db
		.insert(mapNodes)
		.values({
			projectId,
			type: "insight",
			label: statement.slice(0, 100),
			insightId,
			positionX: 0,
			positionY: 0,
			createdBy: userId,
		})
		.returning({ id: mapNodes.id });

	if (!created) throw new Error("Failed to create insight map node");
	return created.id;
}
