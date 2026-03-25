import { z } from "zod";

export const acceptInsightSchema = z.object({
	statement: z
		.string()
		.min(1, "Insight statement is required")
		.max(500, "Statement must be under 500 characters")
		.trim(),
	themeTag: z
		.string()
		.max(50)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),
	isAiGenerated: z.boolean(),
	evidenceQuoteIds: z.array(z.string().uuid()).min(0).max(50),
	problemNodeId: z.string().uuid().optional().nullable(),
});

export const createProblemSchema = z.object({
	label: z
		.string()
		.min(1, "Problem statement is required")
		.max(300, "Problem statement must be under 300 characters")
		.trim(),
	description: z
		.string()
		.max(1000)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),
});

export const createManualInsightSchema = z.object({
	statement: z
		.string()
		.min(1, "Insight statement is required")
		.max(500, "Statement must be under 500 characters")
		.trim(),
	themeTag: z
		.string()
		.max(50)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),
	evidenceQuoteIds: z.array(z.string().uuid()).min(0).max(50),
	problemNodeId: z.string().uuid().optional().nullable(),
});

export const updateInsightSchema = z.object({
	insightId: z.string().uuid(),
	statement: z
		.string()
		.min(1, "Insight statement is required")
		.max(500, "Statement must be under 500 characters")
		.trim()
		.optional(),
	themeTag: z
		.string()
		.max(50)
		.trim()
		.optional()
		.nullable()
		.transform((v) => (v === undefined ? undefined : v || null)),
});

export type AcceptInsightInput = z.infer<typeof acceptInsightSchema>;
export type CreateProblemInput = z.infer<typeof createProblemSchema>;
export type CreateManualInsightInput = z.infer<typeof createManualInsightSchema>;
export type UpdateInsightInput = z.infer<typeof updateInsightSchema>;
