import { db } from "@/lib/db";
import { presence, users } from "@/lib/db/schema";
import { and, eq, gt, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PresenceUser {
	userId: string;
	name: string;
	avatarUrl: string | null;
	phase: string | null;
	lastSeenAt: Date;
}

// ── Query ──────────────────────────────────────────────────────────────────────

const PRESENCE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function getActivePresence(projectId: string): Promise<PresenceUser[]> {
	const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

	const rows = await db
		.select({
			userId: presence.userId,
			name: users.name,
			avatarUrl: users.avatarUrl,
			phase: presence.phase,
			lastSeenAt: presence.lastSeenAt,
		})
		.from(presence)
		.innerJoin(users, eq(users.id, presence.userId))
		.where(and(eq(presence.projectId, projectId), gt(presence.lastSeenAt, cutoff)));

	return rows;
}

// ── Heartbeat (upsert) ─────────────────────────────────────────────────────────

type Phase = "vault" | "engine" | "map" | "stack" | "team";

export async function upsertPresence(
	userId: string,
	projectId: string,
	phase: Phase | null,
): Promise<void> {
	await db
		.insert(presence)
		.values({
			userId,
			projectId,
			phase,
			lastSeenAt: new Date(),
		})
		.onConflictDoUpdate({
			target: [presence.userId, presence.projectId],
			set: {
				phase,
				lastSeenAt: new Date(),
			},
		});
}
