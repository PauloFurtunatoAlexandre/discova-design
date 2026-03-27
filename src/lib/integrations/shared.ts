import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
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

// ── Token encryption helpers (AES-256-GCM) ─────────────────────────────────

function getEncryptionKey(): Buffer {
	const raw = process.env.INTEGRATION_ENCRYPTION_KEY;
	if (!raw || raw.length < 32) {
		if (process.env.NODE_ENV === "production") {
			throw new Error(
				"INTEGRATION_ENCRYPTION_KEY must be set and at least 32 characters in production",
			);
		}
		// Dev-only fallback — never used in production
		return Buffer.from("dev-only-key-do-not-use-in-prod!"); // exactly 32 bytes
	}
	// Use first 32 bytes of the key (AES-256 requires 32-byte key)
	return Buffer.from(raw.slice(0, 32));
}

/**
 * Encrypt a token using AES-256-GCM.
 * Output format: base64(iv:authTag:ciphertext) — all binary, colon-separated after decode.
 */
export function encryptToken(token: string): string {
	const key = getEncryptionKey();
	const iv = randomBytes(12); // 96-bit IV for GCM
	const cipher = createCipheriv("aes-256-gcm", key, iv);

	const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
	const authTag = cipher.getAuthTag(); // 16 bytes

	// Pack as: iv (12) + authTag (16) + ciphertext (variable)
	const packed = Buffer.concat([iv, authTag, encrypted]);
	return packed.toString("base64");
}

/**
 * Decrypt a token encrypted with encryptToken().
 */
export function decryptToken(encrypted: string): string {
	const key = getEncryptionKey();
	const packed = Buffer.from(encrypted, "base64");

	if (packed.length < 28) {
		throw new Error("Invalid encrypted token: too short");
	}

	const iv = packed.subarray(0, 12);
	const authTag = packed.subarray(12, 28);
	const ciphertext = packed.subarray(28);

	const decipher = createDecipheriv("aes-256-gcm", key, iv);
	decipher.setAuthTag(authTag);

	const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
	return decrypted.toString("utf8");
}
