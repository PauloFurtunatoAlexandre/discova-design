import { z } from "zod";

// ── RICE field update ─────────────────────────────────────────────────────────

export const updateRiceFieldSchema = z.object({
	stackItemId: z.string().uuid(),
	field: z.enum(["reachOverride", "impactOverride", "confidenceOverride", "effortManual"]),
	value: z.number().finite().min(0, "Value must be non-negative").nullable(),
});

export type UpdateRiceFieldInput = z.infer<typeof updateRiceFieldSchema>;

// ── Tier update ───────────────────────────────────────────────────────────────

export const updateTierSchema = z.object({
	stackItemId: z.string().uuid(),
	tier: z.enum(["now", "next", "later", "someday"]).nullable(),
});

export type UpdateTierInput = z.infer<typeof updateTierSchema>;

// ── Sync stack items (trigger) ────────────────────────────────────────────────

export const syncStackItemsSchema = z.object({
	// No extra fields — projectId comes from ctx
});

export type SyncStackItemsInput = z.infer<typeof syncStackItemsSchema>;
