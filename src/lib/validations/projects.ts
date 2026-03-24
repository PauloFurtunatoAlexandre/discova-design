import { z } from "zod";

export const createProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Project name is required")
		.max(200, "Project name must be under 200 characters"),
	description: z
		.string()
		.max(1000, "Description must be under 1000 characters")
		.trim()
		.optional()
		.or(z.literal("")),
});

export const updateProjectSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Project name is required")
		.max(200, "Project name must be under 200 characters")
		.optional(),
	description: z
		.string()
		.max(1000, "Description must be under 1000 characters")
		.trim()
		.optional()
		.or(z.literal("")),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
