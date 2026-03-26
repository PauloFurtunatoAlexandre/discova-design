import { db } from "@/lib/db";
import { comments, users } from "@/lib/db/schema";
import { and, asc, eq, isNull, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CommentThread {
	id: string;
	content: string;
	authorId: string;
	authorName: string;
	authorAvatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	replies: CommentReply[];
}

export interface CommentReply {
	id: string;
	content: string;
	authorId: string;
	authorName: string;
	authorAvatar: string | null;
	createdAt: Date;
	updatedAt: Date;
}

// ── Query ──────────────────────────────────────────────────────────────────────

type TargetType = "insight" | "problem" | "solution" | "stack_item";

export async function getCommentThreads(
	targetType: TargetType,
	targetId: string,
): Promise<CommentThread[]> {
	// Fetch top-level comments
	const topLevel = await db
		.select({
			id: comments.id,
			content: comments.content,
			authorId: comments.authorId,
			authorName: users.name,
			authorAvatar: users.avatarUrl,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
		})
		.from(comments)
		.innerJoin(users, eq(users.id, comments.authorId))
		.where(
			and(
				eq(comments.targetType, targetType),
				eq(comments.targetId, targetId),
				isNull(comments.parentId),
			),
		)
		.orderBy(asc(comments.createdAt));

	if (topLevel.length === 0) return [];

	// Fetch all replies for these threads in one query
	const parentIds = topLevel.map((c) => c.id);
	const allReplies = await db
		.select({
			id: comments.id,
			parentId: comments.parentId,
			content: comments.content,
			authorId: comments.authorId,
			authorName: users.name,
			authorAvatar: users.avatarUrl,
			createdAt: comments.createdAt,
			updatedAt: comments.updatedAt,
		})
		.from(comments)
		.innerJoin(users, eq(users.id, comments.authorId))
		.where(sql`${comments.parentId} = ANY(${parentIds})`)
		.orderBy(asc(comments.createdAt));

	// Group replies by parent
	const repliesByParent = new Map<string, CommentReply[]>();
	for (const reply of allReplies) {
		if (!reply.parentId) continue;
		const list = repliesByParent.get(reply.parentId) ?? [];
		list.push({
			id: reply.id,
			content: reply.content,
			authorId: reply.authorId,
			authorName: reply.authorName,
			authorAvatar: reply.authorAvatar,
			createdAt: reply.createdAt,
			updatedAt: reply.updatedAt,
		});
		repliesByParent.set(reply.parentId, list);
	}

	return topLevel.map((c) => ({
		...c,
		replies: repliesByParent.get(c.id) ?? [],
	}));
}

// ── Count ──────────────────────────────────────────────────────────────────────

export async function getCommentCount(targetType: TargetType, targetId: string): Promise<number> {
	const [result] = await db
		.select({ count: sql<number>`COUNT(*)::int`.mapWith(Number) })
		.from(comments)
		.where(and(eq(comments.targetType, targetType), eq(comments.targetId, targetId)));

	return result?.count ?? 0;
}
