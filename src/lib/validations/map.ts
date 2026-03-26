import { z } from "zod";

export const createMapNodeSchema = z.object({
	type: z.enum(["problem", "solution"]),
	label: z
		.string()
		.min(1, "Label is required")
		.max(300, "Label must be under 300 characters")
		.trim(),
	description: z
		.string()
		.max(1000)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),
});

export const createConnectionSchema = z.object({
	sourceNodeId: z.string().uuid("Invalid source node"),
	targetNodeId: z.string().uuid("Invalid target node"),
});

export const updateNodePositionSchema = z.object({
	nodeId: z.string().uuid(),
	positionX: z.number().finite(),
	positionY: z.number().finite(),
});

export const deleteMapNodeSchema = z.object({
	nodeId: z.string().uuid(),
});

export const deleteConnectionSchema = z.object({
	connectionId: z.string().uuid(),
});

export type CreateMapNodeInput = z.infer<typeof createMapNodeSchema>;
export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateNodePositionInput = z.infer<typeof updateNodePositionSchema>;
