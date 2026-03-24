import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import slugifyLib from "slugify";

// Lowercase-only, 4-char suffix — avoids uppercase in slugs
const nanoidSlug = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 4);

/**
 * Generate a URL-safe slug from a name.
 * Appends a random 4-char lowercase suffix to handle collisions.
 *
 * Examples:
 *   "Paulo's Workspace" → "paulos-workspace-a3xk"
 *   "Acme Inc."         → "acme-inc-f7bq"
 *   "@#$%"              → "workspace-xk3q" (fallback)
 */
export function generateSlug(name: string): string {
	// Strip characters that slugify would transliterate to English words
	// (e.g. "$" → "dollar") so special-char-only names fall back to "workspace"
	const sanitized = name.replace(/[^a-zA-Z0-9\s'-]/g, " ").trim();

	const base = slugifyLib(sanitized, {
		lower: true,
		strict: true,
		trim: true,
	});

	const safeName = base || "workspace";
	return `${safeName}-${nanoidSlug()}`;
}

/**
 * Generate a unique slug, verifying against the database.
 * Retries up to 5 times on collision (extremely unlikely with nanoid).
 */
export async function generateUniqueSlug(name: string): Promise<string> {
	for (let i = 0; i < 5; i++) {
		const slug = generateSlug(name);
		const existing = await db.query.workspaces.findFirst({
			where: eq(workspaces.slug, slug),
			columns: { id: true },
		});
		if (!existing) return slug;
	}

	const sanitized = name.replace(/[^a-zA-Z0-9\s'-]/g, " ").trim();
	const base = slugifyLib(sanitized, { lower: true, strict: true, trim: true }) || "workspace";
	return `${base}-${customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 8)()}`;
}
