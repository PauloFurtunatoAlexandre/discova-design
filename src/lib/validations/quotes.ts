import { z } from "zod";

export const createQuoteSchema = z
	.object({
		noteId: z.string().uuid("Invalid note ID"),
		text: z.string().min(1, "Quote text cannot be empty").max(5000, "Quote text too long"),
		startOffset: z.number().int().min(0, "Start offset must be non-negative"),
		endOffset: z.number().int().min(1, "End offset must be positive"),
	})
	.refine((data) => data.endOffset > data.startOffset, {
		message: "End offset must be greater than start offset",
		path: ["endOffset"],
	});

export const deleteQuoteSchema = z.object({
	quoteId: z.string().uuid("Invalid quote ID"),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;
