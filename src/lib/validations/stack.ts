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

// ── Lock + Snapshot ──────────────────────────────────────────────────────────

export const lockStackSchema = z.object({
	passcode: z
		.string()
		.min(4, "Passcode must be at least 4 characters")
		.max(64, "Passcode must be under 64 characters"),
	viewMode: z.enum(["stakeholder", "presentation"]),
});

export type LockStackInput = z.infer<typeof lockStackSchema>;

export const unlockStackSchema = z.object({
	snapshotId: z.string().uuid(),
});

export type UnlockStackInput = z.infer<typeof unlockStackSchema>;
