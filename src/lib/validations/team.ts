import { z } from "zod";

export const inviteMemberSchema = z.object({
	email: z.string().email("Invalid email address").trim().toLowerCase(),
	tier: z.enum(["member", "viewer"]),
	workspacePreset: z.enum(["researcher", "pm", "member"]).nullable(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const changeTierSchema = z.object({
	memberId: z.string().uuid(),
	tier: z.enum(["admin", "member", "viewer"]),
});

export type ChangeTierInput = z.infer<typeof changeTierSchema>;

export const changePresetSchema = z.object({
	memberId: z.string().uuid(),
	workspacePreset: z.enum(["researcher", "pm", "member"]).nullable(),
});

export type ChangePresetInput = z.infer<typeof changePresetSchema>;

export const removeMemberSchema = z.object({
	memberId: z.string().uuid(),
	anonymize: z.boolean().default(false),
});

export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
