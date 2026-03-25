"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { db } from "@/lib/db";
import { noteTags, researchNotes, tags } from "@/lib/db/schema";
import { withPermission } from "@/lib/permissions";
import { createNoteSchema } from "@/lib/validations/vault";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Strip <script> tags as defense-in-depth (content is plain text in MVP). */
function sanitizeContent(content: string): string {
	return content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
}

// ─── Create Note ──────────────────────────────────────────────────────────────

export const createNoteAction = withPermission(
	{ phase: "vault", action: "write" },
	async (
		ctx,
		args: {
			workspaceId: string;
			projectId: string;
			participantName: string;
			sessionDate: string;
			rawContent: string;
			researchMethod?: string | null;
			userSegment?: string | null;
			emotionalTone?: string | null;
			assumptionsTested?: string | null;
			followUpNeeded?: boolean;
			sessionRecordingUrl?: string | null;
			tags?: string[];
		},
	): Promise<
		{ success: true; noteId: string } | { error: string; fieldErrors?: Record<string, string[]> }
	> => {
		// 1. Validate input
		const parsed = createNoteSchema.safeParse({
			participantName: args.participantName,
			sessionDate: args.sessionDate,
			rawContent: args.rawContent,
			researchMethod: args.researchMethod ?? null,
			userSegment: args.userSegment ?? null,
			emotionalTone: args.emotionalTone ?? null,
			assumptionsTested: args.assumptionsTested ?? null,
			followUpNeeded: args.followUpNeeded ?? false,
			sessionRecordingUrl: args.sessionRecordingUrl ?? null,
			tags: args.tags ?? [],
		});

		if (!parsed.success) {
			return { error: "Validation failed", fieldErrors: parsed.error.flatten().fieldErrors };
		}

		const data = parsed.data;

		// 2. Sanitize content
		const safeContent = sanitizeContent(data.rawContent);

		// 3. Insert note — always use ctx.projectId to prevent IDOR
		const [note] = await db
			.insert(researchNotes)
			.values({
				projectId: ctx.projectId,
				participantName: data.participantName,
				sessionDate: data.sessionDate,
				rawContent: safeContent,
				researchMethod: data.researchMethod ?? null,
				userSegment: data.userSegment ?? null,
				emotionalTone: data.emotionalTone ?? null,
				assumptionsTested: data.assumptionsTested ?? null,
				followUpNeeded: data.followUpNeeded,
				sessionRecordingUrl: data.sessionRecordingUrl ?? null,
				createdBy: ctx.userId,
			})
			.returning({ id: researchNotes.id });

		if (!note) return { error: "Failed to create note" };

		// 4. Handle tags (upsert + link)
		if (data.tags && data.tags.length > 0) {
			for (const tagName of data.tags) {
				// Insert tag — ignore if already exists due to unique constraint
				await db
					.insert(tags)
					.values({ projectId: ctx.projectId, name: tagName })
					.onConflictDoNothing();

				// Fetch the tag id
				const tag = await db.query.tags.findFirst({
					where: and(eq(tags.projectId, ctx.projectId), eq(tags.name, tagName)),
					columns: { id: true },
				});

				if (tag) {
					await db
						.insert(noteTags)
						.values({ noteId: note.id, tagId: tag.id })
						.onConflictDoNothing();
				}
			}
		}

		// 5. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "note.created",
			targetType: "research_note",
			targetId: note.id,
		}).catch(() => {});

		// 6. Revalidate vault list
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/vault`, "page");

		return { success: true, noteId: note.id };
	},
);

// ─── Delete Note ──────────────────────────────────────────────────────────────

export const deleteNoteAction = withPermission(
	{ phase: "vault", action: "write" },
	async (
		ctx,
		args: { workspaceId: string; projectId: string; noteId: string },
	): Promise<{ success: true } | { error: string }> => {
		// 1. Verify note belongs to this project (anti-IDOR)
		const note = await db.query.researchNotes.findFirst({
			where: and(eq(researchNotes.id, args.noteId), eq(researchNotes.projectId, ctx.projectId)),
			columns: { id: true, createdBy: true },
		});

		if (!note) return { error: "Note not found" };

		// 2. Verify creator OR admin
		if (note.createdBy !== ctx.userId && ctx.tier !== "admin") {
			return { error: "You can only delete your own notes" };
		}

		// 3. Delete (CASCADE handles quotes, note_tags, etc.)
		await db.delete(researchNotes).where(eq(researchNotes.id, note.id));

		// 4. Audit log
		createAuditEntry({
			workspaceId: ctx.workspaceId,
			userId: ctx.userId,
			action: "note.deleted",
			targetType: "research_note",
			targetId: note.id,
		}).catch(() => {});

		// 5. Revalidate
		revalidatePath(`/${ctx.workspaceId}/${ctx.projectId}/vault`, "page");

		return { success: true };
	},
);
