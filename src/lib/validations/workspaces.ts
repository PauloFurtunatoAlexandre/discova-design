import { z } from "zod";

export const createWorkspaceSchema = z.object({
	name: z
		.string()
		.min(1, "Workspace name is required")
		.max(100, "Workspace name must be under 100 characters")
		.trim(),
	logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export const updateWorkspaceSchema = z.object({
	name: z
		.string()
		.min(1, "Workspace name is required")
		.max(100, "Workspace name must be under 100 characters")
		.trim()
		.optional(),
	logoUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
