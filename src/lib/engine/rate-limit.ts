/**
 * Rate limiter for AI analysis.
 * - Max 10 analyses per user per hour
 * - Max 3 concurrent analyses per workspace
 *
 * MVP: in-memory (resets on restart).
 * Production: replace with Redis / Upstash.
 */

interface RateLimitState {
	count: number;
	windowStart: number;
}

const userLimits = new Map<string, RateLimitState>();
const workspaceConcurrency = new Map<string, number>();

const MAX_PER_HOUR = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_CONCURRENT = 3;

export function checkAnalysisRateLimit(userId: string): {
	allowed: boolean;
	remaining: number;
	retryAfterSeconds?: number;
} {
	const now = Date.now();
	const state = userLimits.get(userId);

	if (!state || now - state.windowStart > WINDOW_MS) {
		userLimits.set(userId, { count: 1, windowStart: now });
		return { allowed: true, remaining: MAX_PER_HOUR - 1 };
	}

	if (state.count >= MAX_PER_HOUR) {
		const retryAfter = Math.ceil((state.windowStart + WINDOW_MS - now) / 1000);
		return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
	}

	state.count += 1;
	return { allowed: true, remaining: MAX_PER_HOUR - state.count };
}

export function acquireWorkspaceConcurrency(workspaceId: string): boolean {
	const current = workspaceConcurrency.get(workspaceId) ?? 0;
	if (current >= MAX_CONCURRENT) return false;
	workspaceConcurrency.set(workspaceId, current + 1);
	return true;
}

export function releaseWorkspaceConcurrency(workspaceId: string): void {
	const current = workspaceConcurrency.get(workspaceId) ?? 0;
	workspaceConcurrency.set(workspaceId, Math.max(0, current - 1));
}

/** Exposed for testing only — resets all in-memory state */
export function _resetForTesting(): void {
	userLimits.clear();
	workspaceConcurrency.clear();
}
