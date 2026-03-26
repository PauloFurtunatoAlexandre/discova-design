import { db } from "@/lib/db";
import { users, workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface WorkspaceMember {
	id: string;
	userId: string;
	name: string;
	email: string;
	avatarUrl: string | null;
	jobTitle: string | null;
	tier: "admin" | "member" | "viewer";
	workspacePreset: "researcher" | "pm" | "member" | null;
	invitedByName: string | null;
	inviteAcceptedAt: Date | null;
	isPending: boolean;
	createdAt: Date;
}

// ── Query ──────────────────────────────────────────────────────────────────────

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
	const wmInvitedBy = sql.raw('"workspace_members"."invited_by"');

	const rows = await db
		.select({
			id: workspaceMembers.id,
			userId: workspaceMembers.userId,
			name: users.name,
			email: users.email,
			avatarUrl: users.avatarUrl,
			jobTitle: users.jobTitle,
			tier: workspaceMembers.tier,
			workspacePreset: workspaceMembers.workspacePreset,
			invitedByName: sql<string | null>`(SELECT name FROM users WHERE users.id = ${wmInvitedBy})`,
			inviteAcceptedAt: workspaceMembers.inviteAcceptedAt,
			createdAt: workspaceMembers.createdAt,
		})
		.from(workspaceMembers)
		.innerJoin(users, eq(users.id, workspaceMembers.userId))
		.where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)))
		.orderBy(workspaceMembers.createdAt);

	return rows.map((row) => ({
		id: row.id,
		userId: row.userId,
		name: row.name,
		email: row.email,
		avatarUrl: row.avatarUrl,
		jobTitle: row.jobTitle,
		tier: row.tier as WorkspaceMember["tier"],
		workspacePreset: row.workspacePreset as WorkspaceMember["workspacePreset"],
		invitedByName: row.invitedByName,
		inviteAcceptedAt: row.inviteAcceptedAt,
		isPending: row.inviteAcceptedAt === null,
		createdAt: row.createdAt,
	}));
}

// ── Stats ──────────────────────────────────────────────────────────────────────

export async function getTeamStats(workspaceId: string): Promise<{
	totalMembers: number;
	admins: number;
	pending: number;
}> {
	const [result] = await db
		.select({
			totalMembers: sql<number>`COUNT(*)::int`.mapWith(Number),
			admins: sql<number>`COUNT(*) FILTER (WHERE tier = 'admin')::int`.mapWith(Number),
			pending:
				sql<number>`COUNT(*) FILTER (WHERE invite_accepted_at IS NULL AND invited_by IS NOT NULL)::int`.mapWith(
					Number,
				),
		})
		.from(workspaceMembers)
		.where(and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)));

	return {
		totalMembers: result?.totalMembers ?? 0,
		admins: result?.admins ?? 0,
		pending: result?.pending ?? 0,
	};
}
