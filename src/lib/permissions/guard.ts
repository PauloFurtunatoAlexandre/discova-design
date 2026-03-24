import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";
import { checkPermission } from "./check-permission";
import { resolvePreset } from "./resolve-preset";
import { getTier } from "./tier-checks";
import type { AuthContext, PermissionAction, Phase, Tier } from "./types";

interface GuardOptions {
	phase: Phase;
	action: PermissionAction;
}

/**
 * Wrap a Server Action with automatic permission checking.
 *
 * Usage:
 * ```typescript
 * export const createNote = withPermission(
 *   { phase: "vault", action: "write" },
 *   async (ctx) => {
 *     // ctx has userId, workspaceId, projectId, tier, preset
 *     // This code only runs if the user has permission
 *   }
 * );
 * ```
 *
 * The guard:
 *   1. Gets the current session (throws if not authenticated)
 *   2. Extracts workspaceId and projectId from the first argument
 *   3. Runs checkPermission
 *   4. Returns { error: reason } if denied
 *   5. Calls the handler with AuthContext if allowed
 *   6. Creates audit log entry for write operations
 *   7. Logs denials with structured logger + Sentry breadcrumb
 */
export function withPermission<TArgs extends { workspaceId: string; projectId: string }, TResult>(
	options: GuardOptions,
	handler: (ctx: AuthContext, args: TArgs) => Promise<TResult>,
) {
	return async (args: TArgs): Promise<TResult | { error: string }> => {
		// Step 1: Get session
		const session = await auth();
		if (!session?.user?.id) {
			return { error: "Authentication required. Please sign in." };
		}

		const userId = session.user.id;
		const { workspaceId, projectId } = args;

		// Step 2: Check permission
		const result = await checkPermission({
			userId,
			workspaceId,
			projectId,
			phase: options.phase,
			action: options.action,
		});

		if (!result.allowed) {
			// Log denial
			logger.warn(
				{
					userId,
					workspaceId,
					projectId,
					phase: options.phase,
					action: options.action,
					reason: result.reason,
				},
				"Server Action permission denied",
			);

			// Sentry breadcrumb for debugging
			Sentry.addBreadcrumb({
				category: "permissions",
				message: `Denied: ${options.action} on ${options.phase}`,
				level: "warning",
				data: { userId, workspaceId, projectId, reason: result.reason },
			});

			return { error: result.reason ?? "Permission denied." };
		}

		// Step 3: Build context
		const tier = (await getTier(userId, workspaceId)) as Tier;
		const preset = await resolvePreset(userId, projectId, workspaceId);

		const ctx: AuthContext = {
			userId,
			workspaceId,
			projectId,
			tier,
			preset,
		};

		// Step 4: Execute handler
		const handlerResult = await handler(ctx, args);

		// Step 5: Audit log for write operations
		if (options.action === "write") {
			createAuditEntry({
				workspaceId,
				userId,
				action: `${options.phase}.write`,
				targetType: options.phase,
				targetId: projectId,
			}).catch(() => {}); // Fire-and-forget
		}

		return handlerResult;
	};
}
