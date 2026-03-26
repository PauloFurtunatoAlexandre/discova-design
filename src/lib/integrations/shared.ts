import { db } from "@/lib/db";
import { integrations } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export type IntegrationType = "jira" | "linear" | "slack" | "figma";

export interface IntegrationRecord {
	id: string;
	workspaceId: string;
	type: IntegrationType;
	config: Record<string, unknown>;
	isActive: boolean;
	connectedBy: string;
	createdAt: Date;
	updatedAt: Date;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export async function getIntegration(
	workspaceId: string,
	type: IntegrationType,
): Promise<IntegrationRecord | null> {
	const [row] = await db
		.select({
			id: integrations.id,
			workspaceId: integrations.workspaceId,
			type: integrations.type,
			config: integrations.config,
			isActive: integrations.isActive,
			connectedBy: integrations.connectedBy,
			createdAt: integrations.createdAt,
			updatedAt: integrations.updatedAt,
		})
		.from(integrations)
		.where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.type, type)))
		.limit(1);

	if (!row) return null;
	return {
		...row,
		type: row.type as IntegrationType,
		config: row.config as Record<string, unknown>,
	};
}

export async function getAllIntegrations(workspaceId: string): Promise<IntegrationRecord[]> {
	const rows = await db
		.select({
			id: integrations.id,
			workspaceId: integrations.workspaceId,
			type: integrations.type,
			config: integrations.config,
			isActive: integrations.isActive,
			connectedBy: integrations.connectedBy,
			createdAt: integrations.createdAt,
			updatedAt: integrations.updatedAt,
		})
		.from(integrations)
		.where(eq(integrations.workspaceId, workspaceId));

	return rows.map((row) => ({
		...row,
		type: row.type as IntegrationType,
		config: row.config as Record<string, unknown>,
	}));
}

export async function upsertIntegration(args: {
	workspaceId: string;
	type: IntegrationType;
	config: Record<string, unknown>;
	accessTokenEncrypted: string | null;
	refreshTokenEncrypted: string | null;
	tokenExpiresAt: Date | null;
	connectedBy: string;
}): Promise<string> {
	const [row] = await db
		.insert(integrations)
		.values({
			workspaceId: args.workspaceId,
			type: args.type,
			config: args.config,
			accessTokenEncrypted: args.accessTokenEncrypted,
			refreshTokenEncrypted: args.refreshTokenEncrypted,
			tokenExpiresAt: args.tokenExpiresAt,
			isActive: true,
			connectedBy: args.connectedBy,
		})
		.onConflictDoUpdate({
			target: [integrations.workspaceId, integrations.type],
			set: {
				config: args.config,
				accessTokenEncrypted: args.accessTokenEncrypted,
				refreshTokenEncrypted: args.refreshTokenEncrypted,
				tokenExpiresAt: args.tokenExpiresAt,
				isActive: true,
				connectedBy: args.connectedBy,
				updatedAt: new Date(),
			},
		})
		.returning({ id: integrations.id });

	if (!row) throw new Error("Failed to upsert integration");
	return row.id;
}

export async function disconnectIntegration(
	workspaceId: string,
	type: IntegrationType,
): Promise<void> {
	await db
		.update(integrations)
		.set({
			isActive: false,
			accessTokenEncrypted: null,
			refreshTokenEncrypted: null,
			tokenExpiresAt: null,
			updatedAt: new Date(),
		})
		.where(and(eq(integrations.workspaceId, workspaceId), eq(integrations.type, type)));
}

// ── Token encryption helpers (placeholder — use a proper KMS in production) ──

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY ?? "dev-key-replace-in-production";

export function encryptToken(token: string): string {
	// In production, use AES-256-GCM with a KMS-managed key
	return Buffer.from(`${ENCRYPTION_KEY}:${token}`).toString("base64");
}

export function decryptToken(encrypted: string): string {
	const decoded = Buffer.from(encrypted, "base64").toString();
	const prefix = `${ENCRYPTION_KEY}:`;
	if (!decoded.startsWith(prefix)) throw new Error("Invalid token encryption");
	return decoded.slice(prefix.length);
}
