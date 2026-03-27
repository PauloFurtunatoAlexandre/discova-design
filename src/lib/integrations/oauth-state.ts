import { createHmac, randomBytes } from "node:crypto";

/**
 * OAuth state parameter CSRF protection.
 *
 * Encodes workspaceId + random nonce into a signed state string.
 * On callback, the signature is verified to prevent CSRF attacks
 * where an attacker crafts an OAuth flow targeting a victim's workspace.
 *
 * Format: base64(workspaceId:nonce:hmac)
 */

function getSigningKey(): string {
	// Reuse NEXTAUTH_SECRET as HMAC key — it's already a strong secret
	const secret = process.env.NEXTAUTH_SECRET;
	if (!secret) {
		throw new Error("NEXTAUTH_SECRET is required for OAuth state signing");
	}
	return secret;
}

/**
 * Create a signed OAuth state parameter containing the workspaceId.
 */
export function createOAuthState(workspaceId: string): string {
	const nonce = randomBytes(16).toString("hex");
	const payload = `${workspaceId}:${nonce}`;
	const hmac = createHmac("sha256", getSigningKey()).update(payload).digest("hex");
	return Buffer.from(`${payload}:${hmac}`).toString("base64url");
}

/**
 * Verify and extract workspaceId from a signed OAuth state parameter.
 * Returns null if the signature is invalid or the format is wrong.
 */
export function verifyOAuthState(state: string): string | null {
	try {
		const decoded = Buffer.from(state, "base64url").toString();
		const parts = decoded.split(":");
		// Format: workspaceId:nonce:hmac
		if (parts.length !== 3) return null;

		const [workspaceId, nonce, providedHmac] = parts;
		if (!workspaceId || !nonce || !providedHmac) return null;

		const payload = `${workspaceId}:${nonce}`;
		const expectedHmac = createHmac("sha256", getSigningKey()).update(payload).digest("hex");

		// Constant-time comparison to prevent timing attacks
		if (providedHmac.length !== expectedHmac.length) return null;
		let mismatch = 0;
		for (let i = 0; i < providedHmac.length; i++) {
			// biome-ignore lint/style/noNonNullAssertion: loop bounds guarantee index
			mismatch |= providedHmac.charCodeAt(i) ^ expectedHmac.charCodeAt(i);
		}
		if (mismatch !== 0) return null;

		return workspaceId;
	} catch {
		return null;
	}
}
