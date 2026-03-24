import { logger } from "@/lib/logger";
import { getPhasePermission } from "./phase-access";
import { resolvePreset } from "./resolve-preset";
import { getTier } from "./tier-checks";
import type { PermissionAction, PermissionResult, Phase } from "./types";

/**
 * Check whether a user is allowed to perform an action on a phase.
 *
 * Logic:
 *   1. Get tier → null = not a workspace member
 *   2. Admin → always allowed
 *   3. Viewer → only read allowed
 *   4. Member → resolve preset → check phase access matrix
 *   5. no_access preset → denied with specific message
 */
export async function checkPermission(params: {
	userId: string;
	workspaceId: string;
	projectId: string;
	phase: Phase;
	action: PermissionAction;
}): Promise<PermissionResult> {
	const { userId, workspaceId, projectId, phase, action } = params;

	// Step 1: Get tier
	const tier = await getTier(userId, workspaceId);
	if (tier === null) {
		logger.warn(
			{ userId, workspaceId, phase, action },
			"Permission denied: not a workspace member",
		);
		return { allowed: false, reason: "You are not a member of this workspace." };
	}

	// Step 2: Admin — always allowed
	if (tier === "admin") {
		return { allowed: true };
	}

	// Step 3: Viewer — read only
	if (tier === "viewer") {
		if (action === "read") {
			return { allowed: true };
		}
		logger.warn({ userId, workspaceId, phase, action }, "Permission denied: viewer cannot write");
		return { allowed: false, reason: "Viewers have read-only access." };
	}

	// Step 4: Member — resolve preset and check phase access
	const preset = await resolvePreset(userId, projectId, workspaceId);

	// Step 5: no_access — preset never assigned
	if (preset === "no_access") {
		logger.warn(
			{ userId, workspaceId, projectId, phase, action },
			"Permission denied: no preset assigned",
		);
		return {
			allowed: false,
			reason: "Your role has not been configured. Contact your workspace Admin.",
		};
	}

	// Check phase access matrix
	const permission = getPhasePermission(preset, phase);

	if (action === "read") {
		// Read is allowed if permission is "read" or "write"
		if (permission === "none") {
			return { allowed: false, reason: `Your role does not have access to ${phase}.` };
		}
		return { allowed: true };
	}

	if (action === "write") {
		if (permission === "write") {
			return { allowed: true };
		}
		if (permission === "read") {
			logger.info(
				{ userId, workspaceId, projectId, phase, action, preset },
				"Permission denied: preset has read-only access to phase",
			);
			return {
				allowed: false,
				reason: `Your ${preset} role has read-only access to ${phase}. Ask an Admin to change your role if you need edit access.`,
			};
		}
		return { allowed: false, reason: `Your role does not have access to ${phase}.` };
	}

	return { allowed: false, reason: "Unknown action." };
}
