/**
 * Permission system types.
 * These are used across the entire application.
 */

/** Permission tier — controls WHAT actions a user can take */
export type Tier = "admin" | "member" | "viewer";

/** Functional preset — controls WHICH phases a Member can edit */
export type Preset = "researcher" | "pm" | "member";

/** Resolved preset including the no-access state */
export type ResolvedPreset = Preset | "no_access";

/** The five phases of Discova */
export type Phase = "vault" | "engine" | "map" | "stack" | "team";

/** Permission level for a specific phase */
export type PhasePermission = "write" | "read" | "none";

/** Action types */
export type PermissionAction = "read" | "write";

/** Result of a permission check */
export interface PermissionResult {
	allowed: boolean;
	reason?: string;
}

/** Full resolved permissions for a user in a project */
export interface ResolvedPermissions {
	tier: Tier | null;
	preset: ResolvedPreset;
	phases: Record<Phase, PhasePermission>;
}

/** Context passed to guarded Server Actions */
export interface AuthContext {
	userId: string;
	workspaceId: string;
	projectId: string;
	tier: Tier;
	preset: ResolvedPreset;
}
