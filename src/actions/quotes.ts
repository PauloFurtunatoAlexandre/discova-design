"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { insightEvidence, quotes, researchNotes } from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import { createQuoteSchema, deleteQuoteSchema } from "@/lib/validations/quotes";
import { and, count, eq } from "drizzle-orm";

// ─── Create Quote ──────────────────────────────────────────────────────────────

export const createQuoteAction = withPermission(
	{ phase: "vault", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			noteId: string;
			text: string;
			startOffset: number;
			endOffset: number;
		},
	): Promise<
		| {
				success: true;
				quote: {
					id: string;
					text: string;
					startOffset: number;
					endOffset: number;
					isStale: boolean;
				};
		  }
		| { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate input
		const parsed = createQuoteSchema.safeParse({
			noteId: args.noteId,
			text: args.text,
			startOffset: args.startOffset,
			endOffset: args.endOffset,
		});

		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		// 2. Verify note belongs to this project (anti-IDOR)
		const note = await db.query.researchNotes.findFirst({
			where: and(
				eq(researchNotes.id, parsed.data.noteId),
				eq(researchNotes.projectId, ctx.projectId),
			),
			columns: { id: true },
		});

		if (!note) return { error: "Note not found" };

		// 3. Insert quote record
		const [quote] = await db
			.insert(quotes)
			.values({
				noteId: parsed.data.noteId,
				text: parsed.data.text,
				startOffset: parsed.data.startOffset,
				endOffset: parsed.data.endOffset,
				createdBy: ctx.userId,
			})
			.returning({
				id: quotes.id,
				text: quotes.text,
				startOffset: quotes.startOffset,
				endOffset: quotes.endOffset,
				isStale: quotes.isStale,
			});

		if (!quote) return { error: "Failed to create quote" };

		// 4. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "quote.created",
			targetType: "quote",
			targetId: quote.id,
			metadata: { noteId: parsed.data.noteId, textLength: parsed.data.text.length },
		}).catch(() => {});

		return { success: true, quote };
	},
);

// ─── Delete Quote ──────────────────────────────────────────────────────────────

export const deleteQuoteAction = withPermission(
	{ phase: "vault", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			quoteId: string;
			force?: boolean;
		},
	): Promise<
		| { success: true }
		| { warning: true; linkedInsightCount: number; message: string }
		| { error: string }
	> => {
		// 1. Validate quoteId
		const parsed = deleteQuoteSchema.safeParse({ quoteId: args.quoteId });
		if (!parsed.success) return { error: "Invalid quote ID" };

		// 2. Fetch quote and verify it belongs to this project (anti-IDOR)
		const quote = await db.query.quotes.findFirst({
			where: eq(quotes.id, parsed.data.quoteId),
			columns: { id: true, noteId: true },
			with: {
				note: {
					columns: { projectId: true },
				},
			},
		});

		if (!quote) return { error: "Quote not found" };
		if (quote.note.projectId !== ctx.projectId) return { error: "Quote not found" };

		// 3. Check if quote is linked to any insights
		const [evidenceRow] = await db
			.select({ linkedCount: count() })
			.from(insightEvidence)
			.where(eq(insightEvidence.quoteId, parsed.data.quoteId));

		const linkedInsightCount = Number(evidenceRow?.linkedCount ?? 0);

		// 4. Warn if linked insights exist and not forced
		if (linkedInsightCount > 0 && !args.force) {
			return {
				warning: true,
				linkedInsightCount,
				message: `This quote is linked to ${linkedInsightCount} insight(s). Deleting it will remove the evidence link.`,
			};
		}

		// 5. Delete (CASCADE in schema handles insight_evidence automatically)
		await db.delete(quotes).where(eq(quotes.id, parsed.data.quoteId));

		// 6. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "quote.deleted",
			targetType: "quote",
			targetId: parsed.data.quoteId,
			metadata: { linkedInsightCount },
		}).catch(() => {});

		return { success: true };
	},
);

// ─── Mark Quote Stale ─────────────────────────────────────────────────────────

export const markQuoteStaleAction = withPermission(
	{ phase: "vault", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			quoteId: string;
		},
	): Promise<{ success: true } | { error: string }> => {
		// Verify quote belongs to a note in this project (anti-IDOR)
		const quote = await db.query.quotes.findFirst({
			where: eq(quotes.id, args.quoteId),
			columns: { id: true },
			with: {
				note: {
					columns: { projectId: true },
				},
			},
		});

		if (!quote) return { error: "Quote not found" };
		if (quote.note.projectId !== ctx.projectId) return { error: "Quote not found" };

		await db.update(quotes).set({ isStale: true }).where(eq(quotes.id, args.quoteId));

		return { success: true };
	},
);
