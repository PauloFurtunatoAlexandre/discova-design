"use server";

import { createAuditEntry } from "@/lib/auth/audit";
import { auth } from "@/lib/auth/config";
import {
	type IntegrationType,
	disconnectIntegration,
	getAllIntegrations,
	getIntegration,
} from "@/lib/integrations/shared";
import { isAdmin, isMember } from "@/lib/permissions/tier-checks";
import { revalidatePath } from "next/cache";

// ── Get All Integrations ────────────────────────────────────────────────────

export async function getIntegrationsAction(args: {
	workspaceId: string;
}): Promise<
	| { integrations: Array<{ type: string; isActive: boolean; config: Record<string, unknown> }> }
	| { error: string }
> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	// Verify user belongs to this workspace
	if (!(await isMember(session.user.id, args.workspaceId))) {
		return { error: "Forbidden" };
	}

	const rows = await getAllIntegrations(args.workspaceId);
	return {
		integrations: rows.map((r) => ({
			type: r.type,
			isActive: r.isActive,
			config: r.config,
		})),
	};
}

// ── Get Single Integration ──────────────────────────────────────────────────

export async function getIntegrationAction(args: {
	workspaceId: string;
	type: IntegrationType;
}): Promise<
	| { integration: { type: string; isActive: boolean; config: Record<string, unknown> } | null }
	| { error: string }
> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	if (!(await isMember(session.user.id, args.workspaceId))) {
		return { error: "Forbidden" };
	}

	const row = await getIntegration(args.workspaceId, args.type);
	if (!row) return { integration: null };

	return {
		integration: {
			type: row.type,
			isActive: row.isActive,
			config: row.config,
		},
	};
}

// ── Disconnect Integration ──────────────────────────────────────────────────

export async function disconnectIntegrationAction(args: {
	workspaceId: string;
	type: IntegrationType;
}): Promise<{ success: true } | { error: string }> {
	const session = await auth();
	if (!session?.user?.id) return { error: "Authentication required" };

	const admin = await isAdmin(session.user.id, args.workspaceId);
	if (!admin) return { error: "Only admins can manage integrations" };

	await disconnectIntegration(args.workspaceId, args.type);

	createAuditEntry({
		workspaceId: args.workspaceId,
		userId: session.user.id,
		action: `integration.${args.type}.disconnected`,
		targetType: "integration",
		targetId: args.type,
	}).catch(() => {});

	revalidatePath(`/${args.workspaceId}`);
	return { success: true };
}
