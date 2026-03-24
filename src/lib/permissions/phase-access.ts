import type { Phase, PhasePermission, ResolvedPreset } from "./types";

/**
 * Phase access matrix.
 *
 * Researcher: Vault R/W, Engine R/W, Map R/W, Stack READ-ONLY, Team READ-ONLY
 * PM:         Vault READ-ONLY, Engine READ-ONLY, Map R/W, Stack R/W, Team R/W
 * Member:     All R/W
 * no_access:  Nothing
 */
const ACCESS_MATRIX: Record<ResolvedPreset, Record<Phase, PhasePermission>> = {
	researcher: {
		vault: "write",
		engine: "write",
		map: "write",
		stack: "read",
		team: "read",
	},
	pm: {
		vault: "read",
		engine: "read",
		map: "write",
		stack: "write",
		team: "write",
	},
	member: {
		vault: "write",
		engine: "write",
		map: "write",
		stack: "write",
		team: "write",
	},
	no_access: {
		vault: "none",
		engine: "none",
		map: "none",
		stack: "none",
		team: "none",
	},
};

/** Check if a preset can edit (write) a specific phase */
export function canEditPhase(preset: ResolvedPreset, phase: Phase): boolean {
	return ACCESS_MATRIX[preset][phase] === "write";
}

/** Check if a preset can view (read) a specific phase */
export function canViewPhase(preset: ResolvedPreset, phase: Phase): boolean {
	const permission = ACCESS_MATRIX[preset][phase];
	return permission === "write" || permission === "read";
}

/** Get the full permission level for a preset + phase combination */
export function getPhasePermission(preset: ResolvedPreset, phase: Phase): PhasePermission {
	return ACCESS_MATRIX[preset][phase];
}

/** Get all phase permissions for a preset (used by the API route) */
export function getAllPhasePermissions(preset: ResolvedPreset): Record<Phase, PhasePermission> {
	return { ...ACCESS_MATRIX[preset] };
}
