import { z } from "zod";

export const createCommentSchema = z.object({
	projectId: z.string().uuid(),
	targetType: z.enum(["insight", "problem", "solution", "stack_item"]),
	targetId: z.string().uuid(),
	parentId: z.string().uuid().nullable(),
	content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export const updateCommentSchema = z.object({
	commentId: z.string().uuid(),
	content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

export const deleteCommentSchema = z.object({
	commentId: z.string().uuid(),
});

export type DeleteCommentInput = z.infer<typeof deleteCommentSchema>;
