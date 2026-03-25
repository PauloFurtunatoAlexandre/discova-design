import { z } from "zod";

export const createNoteSchema = z.object({
	participantName: z
		.string()
		.trim()
		.min(1, "Participant or source name is required")
		.max(200, "Name must be under 200 characters"),

	sessionDate: z
		.string()
		.refine((val) => {
			const date = new Date(val);
			return !Number.isNaN(date.getTime());
		}, "Please select a valid date")
		.refine((val) => {
			const date = new Date(val);
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(0, 0, 0, 0);
			return date < tomorrow;
		}, "Session date cannot be in the future"),

	rawContent: z.string().min(1, "Notes content is required"),

	researchMethod: z
		.enum(["interview", "survey", "usability_test", "observation", "other"])
		.optional()
		.nullable(),

	userSegment: z
		.string()
		.max(200)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),

	emotionalTone: z.enum(["frustrated", "delighted", "neutral", "mixed"]).optional().nullable(),

	assumptionsTested: z
		.string()
		.max(2000)
		.trim()
		.optional()
		.nullable()
		.transform((v) => v || null),

	followUpNeeded: z.boolean().optional().default(false),

	sessionRecordingUrl: z
		.union([
			z
				.string()
				.min(1)
				.url("Must be a valid URL")
				.refine((v) => !v.toLowerCase().startsWith("javascript:"), "Invalid URL protocol"),
			z.literal("").transform((): null => null),
			z.null(),
		])
		.optional()
		.nullable()
		.transform((v) => v ?? null),

	tags: z
		.array(z.string().trim().min(1).max(50))
		.max(20, "Maximum 20 tags per note")
		.optional()
		.default([]),
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

// ─── Update Note Content ───────────────────────────────────────────────────────

export const updateNoteContentSchema = z.object({
	content: z.string().min(1, "Content cannot be empty"),
});

// ─── Update Note Metadata ──────────────────────────────────────────────────────

export const updateNoteMetadataSchema = z.discriminatedUnion("field", [
	z.object({
		field: z.literal("researchMethod"),
		value: z.enum(["interview", "survey", "usability_test", "observation", "other"]).nullable(),
	}),
	z.object({
		field: z.literal("userSegment"),
		value: z.string().max(200).nullable(),
	}),
	z.object({
		field: z.literal("emotionalTone"),
		value: z.enum(["frustrated", "delighted", "neutral", "mixed"]).nullable(),
	}),
	z.object({
		field: z.literal("assumptionsTested"),
		value: z.string().max(2000).nullable(),
	}),
	z.object({
		field: z.literal("followUpNeeded"),
		value: z.boolean(),
	}),
	z.object({
		field: z.literal("sessionRecordingUrl"),
		value: z
			.union([
				z
					.string()
					.min(1)
					.url("Must be a valid URL")
					.refine((v) => !v.toLowerCase().startsWith("javascript:"), "Invalid URL protocol"),
				z.literal("").transform((): null => null),
				z.null(),
			])
			.nullable()
			.transform((v) => v ?? null),
	}),
]);

export type UpdateNoteMetadataInput = z.infer<typeof updateNoteMetadataSchema>;

// ─── Update Note Tags ──────────────────────────────────────────────────────────

export const updateNoteTagsSchema = z.object({
	tags: z.array(z.string().trim().min(1).max(50)).max(20, "Maximum 20 tags per note").default([]),
});
