/**
 * Simple in-memory rate limiter for MVP.
 * Production: replace with @upstash/ratelimit.
 */

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

if (typeof setInterval !== "undefined") {
	setInterval(
		() => {
			const now = Date.now();
			for (const [key, entry] of store) {
				if (now > entry.resetAt) {
					store.delete(key);
				}
			}
		},
		5 * 60 * 1000,
	);
}

export function checkRateLimit(
	key: string,
	{ maxAttempts = 5, windowMs = 60_000 }: { maxAttempts?: number; windowMs?: number } = {},
): { allowed: boolean; remaining: number; resetAt: number } {
	const now = Date.now();
	const entry = store.get(key);

	if (!entry || now > entry.resetAt) {
		store.set(key, { count: 1, resetAt: now + windowMs });
		return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs };
	}

	entry.count += 1;
	const allowed = entry.count <= maxAttempts;
	const remaining = Math.max(0, maxAttempts - entry.count);

	return { allowed, remaining, resetAt: entry.resetAt };
}

/** Reset rate limit for a key (e.g., after successful login) */
export function resetRateLimit(key: string): void {
	store.delete(key);
}
