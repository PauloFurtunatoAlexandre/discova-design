/**
 * Safely coerce a Date-or-string to a Date object.
 *
 * Date objects become plain strings when serialized across the
 * Server Component → Client Component boundary. This helper
 * accepts both forms so callers never need to remember which
 * side of the boundary they are on.
 */
export function toDate(value: Date | string): Date {
	return typeof value === "string" ? new Date(value) : value;
}

/**
 * Human-readable relative time string ("just now", "3m ago", "2d ago").
 * Falls back to locale date for anything older than 7 days.
 */
export function formatRelativeTime(date: Date | string): string {
	const d = toDate(date);
	const diff = Date.now() - d.getTime();
	const minutes = Math.floor(diff / 60_000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
