// Permission system — single entry point
export { checkPermission } from "./check-permission";
export { withPermission } from "./guard";
export { resolvePreset } from "./resolve-preset";
export {
	canEditPhase,
	canViewPhase,
	getPhasePermission,
	getAllPhasePermissions,
} from "./phase-access";
export { getTier, isAdmin, isMember, isViewer } from "./tier-checks";
export type {
	Tier,
	Preset,
	ResolvedPreset,
	Phase,
	PhasePermission,
	PermissionAction,
	PermissionResult,
	ResolvedPermissions,
	AuthContext,
} from "./types";
