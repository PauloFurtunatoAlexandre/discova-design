"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import {
	createCommentSchema,
	deleteCommentSchema,
	updateCommentSchema,
} from "@/lib/validations/comments";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// ── Create Comment ──────────────────────────────────────────────────────────

export async function createCommentAction(args: {
	projectId: string;
	workspaceId: string;
	targetType: "insight" | "problem" | "solution" | "stack_item";
	targetId: string;
	parentId: string | null;
	content: string;
}): Promise<{ success: true; commentId: string } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const parsed = createCommentSchema.safeParse({
		projectId: args.projectId,
		targetType: args.targetType,
		targetId: args.targetId,
		parentId: args.parentId,
		content: args.content,
	});
	if (!parsed.success) {
		return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
	}

	// If replying, verify parent exists and belongs to same target
	if (parsed.data.parentId) {
		const [parent] = await db
			.select({ id: comments.id })
			.from(comments)
			.where(
				and(
					eq(comments.id, parsed.data.parentId),
					eq(comments.targetType, parsed.data.targetType),
					eq(comments.targetId, parsed.data.targetId),
				),
			)
			.limit(1);

		if (!parent) return { error: "Parent comment not found" };
	}

	const [comment] = await db
		.insert(comments)
		.values({
			projectId: parsed.data.projectId,
			targetType: parsed.data.targetType,
			targetId: parsed.data.targetId,
			parentId: parsed.data.parentId,
			content: parsed.data.content,
			authorId: session.user.id,
		})
		.returning({ id: comments.id });

	if (!comment) return { error: "Failed to create comment" };

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "comment.created",
		targetType: "comment",
		targetId: comment.id,
		metadata: {
			on: parsed.data.targetType,
			targetId: parsed.data.targetId,
			isReply: !!parsed.data.parentId,
		},
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true, commentId: comment.id };
}

// ── Update Comment ──────────────────────────────────────────────────────────

export async function updateCommentAction(args: {
	commentId: string;
	workspaceId: string;
	content: string;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const parsed = updateCommentSchema.safeParse({
		commentId: args.commentId,
		content: args.content,
	});
	if (!parsed.success) {
		return { error: parsed.error.errors[0]?.message ?? "Invalid input" };
	}

	// Verify ownership
	const [existing] = await db
		.select({ id: comments.id, authorId: comments.authorId })
		.from(comments)
		.where(eq(comments.id, parsed.data.commentId))
		.limit(1);

	if (!existing) return { error: "Comment not found" };
	if (existing.authorId !== session.user.id) {
		return { error: "You can only edit your own comments" };
	}

	await db
		.update(comments)
		.set({ content: parsed.data.content, updatedAt: new Date() })
		.where(eq(comments.id, parsed.data.commentId));

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "comment.updated",
		targetType: "comment",
		targetId: parsed.data.commentId,
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}

// ── Delete Comment ──────────────────────────────────────────────────────────

export async function deleteCommentAction(args: {
	commentId: string;
	workspaceId: string;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const parsed = deleteCommentSchema.safeParse({
		commentId: args.commentId,
	});
	if (!parsed.success) return { error: "Invalid input" };

	// Verify ownership
	const [existing] = await db
		.select({ id: comments.id, authorId: comments.authorId })
		.from(comments)
		.where(eq(comments.id, parsed.data.commentId))
		.limit(1);

	if (!existing) return { error: "Comment not found" };
	if (existing.authorId !== session.user.id) {
		return { error: "You can only delete your own comments" };
	}

	// Delete replies first, then the comment
	await db.delete(comments).where(eq(comments.parentId, parsed.data.commentId));
	await db.delete(comments).where(eq(comments.id, parsed.data.commentId));

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: "comment.deleted",
		targetType: "comment",
		targetId: parsed.data.commentId,
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}
