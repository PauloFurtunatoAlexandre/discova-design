import { db } from "@/lib/db";
import {
	insightCards,
	mapNodes,
	researchNotes,
	stackItems,
	workspaceMembers,
} from "@/lib/db/schema";
import { and, count, eq, isNull, sql } from "drizzle-orm";

export interface PhaseStats {
	completed: number;
	total: number;
	percentage: number;
}

export interface DashboardData {
	phases: {
		vault: PhaseStats;
		engine: PhaseStats;
		map: PhaseStats;
		stack: PhaseStats;
		team: PhaseStats;
	};
	hasAnyData: boolean;
}

export async function getDashboardData(
	projectId: string,
	workspaceId: string,
): Promise<DashboardData> {
	const [vaultStats, engineStats, mapStats, stackStats, teamStats] = await Promise.all([
		getVaultStats(projectId),
		getEngineStats(projectId),
		getMapStats(projectId),
		getStackStats(projectId),
		getTeamStats(workspaceId),
	]);

	return {
		phases: {
			vault: vaultStats,
			engine: engineStats,
			map: mapStats,
			stack: stackStats,
			team: teamStats,
		},
		hasAnyData: vaultStats.total > 0,
	};
}

// ─── Vault ────────────────────────────────────────────────────────────────────
// % of notes with ≥1 quote extracted

async function getVaultStats(projectId: string): Promise<PhaseStats> {
	const [[totalResult], [completedResult]] = await Promise.all([
		db.select({ count: count() }).from(researchNotes).where(eq(researchNotes.projectId, projectId)),
		// Correlated subquery avoids ambiguous "id" across joined tables
		db
			.select({ count: count() })
			.from(researchNotes)
			.where(
				and(
					eq(researchNotes.projectId, projectId),
					sql`EXISTS (SELECT 1 FROM quotes WHERE quotes.note_id = ${researchNotes.id})`,
				),
			),
	]);

	const total = Number(totalResult?.count ?? 0);
	const completed = Number(completedResult?.count ?? 0);
	return { total, completed, percentage: toPercent(completed, total) };
}

// ─── Engine ───────────────────────────────────────────────────────────────────
// % of notes that have ≥1 insight derived from them

async function getEngineStats(projectId: string): Promise<PhaseStats> {
	const [[totalResult], [completedResult]] = await Promise.all([
		db.select({ count: count() }).from(researchNotes).where(eq(researchNotes.projectId, projectId)),
		// Correlated EXISTS avoids triple-join with ambiguous "id" across all three tables
		db
			.select({ count: count() })
			.from(researchNotes)
			.where(
				and(
					eq(researchNotes.projectId, projectId),
					sql`EXISTS (
						SELECT 1 FROM insight_evidence
						WHERE insight_evidence.quote_id IN (
							SELECT quotes.id FROM quotes WHERE quotes.note_id = ${researchNotes.id}
						)
					)`,
				),
			),
	]);

	const total = Number(totalResult?.count ?? 0);
	const completed = Number(completedResult?.count ?? 0);
	return { total, completed, percentage: toPercent(completed, total) };
}

// ─── Map ──────────────────────────────────────────────────────────────────────
// % of insights connected to a problem node on the map

async function getMapStats(projectId: string): Promise<PhaseStats> {
	const [[totalResult], [completedResult]] = await Promise.all([
		db.select({ count: count() }).from(insightCards).where(eq(insightCards.projectId, projectId)),
		// Correlated EXISTS avoids JOIN with ambiguous "id" between mapNodes and mapConnections
		db
			.select({ count: count() })
			.from(mapNodes)
			.where(
				and(
					eq(mapNodes.projectId, projectId),
					eq(mapNodes.type, "insight"),
					sql`${mapNodes.insightId} IS NOT NULL`,
					sql`EXISTS (SELECT 1 FROM map_connections WHERE map_connections.source_node_id = ${mapNodes.id})`,
				),
			),
	]);

	const total = Number(totalResult?.count ?? 0);
	const completed = Number(completedResult?.count ?? 0);
	return { total, completed, percentage: toPercent(completed, total) };
}

// ─── Stack ────────────────────────────────────────────────────────────────────
// % of solutions with a complete RICE score

async function getStackStats(projectId: string): Promise<PhaseStats> {
	const [[totalResult], [completedResult]] = await Promise.all([
		db
			.select({ count: count() })
			.from(mapNodes)
			.where(and(eq(mapNodes.projectId, projectId), eq(mapNodes.type, "solution"))),
		db
			.select({ count: count() })
			.from(stackItems)
			.where(and(eq(stackItems.projectId, projectId), sql`${stackItems.riceScore} IS NOT NULL`)),
	]);

	const total = Number(totalResult?.count ?? 0);
	const completed = Number(completedResult?.count ?? 0);
	return { total, completed, percentage: toPercent(completed, total) };
}

// ─── Team ─────────────────────────────────────────────────────────────────────
// % of workspace members with a preset assigned

async function getTeamStats(workspaceId: string): Promise<PhaseStats> {
	const [[totalResult], [completedResult]] = await Promise.all([
		db
			.select({ count: count() })
			.from(workspaceMembers)
			.where(
				and(eq(workspaceMembers.workspaceId, workspaceId), isNull(workspaceMembers.removedAt)),
			),
		db
			.select({ count: count() })
			.from(workspaceMembers)
			.where(
				and(
					eq(workspaceMembers.workspaceId, workspaceId),
					isNull(workspaceMembers.removedAt),
					sql`${workspaceMembers.workspacePreset} IS NOT NULL`,
				),
			),
	]);

	const total = Number(totalResult?.count ?? 0);
	const completed = Number(completedResult?.count ?? 0);
	return { total, completed, percentage: toPercent(completed, total) };
}

// ─── Util ─────────────────────────────────────────────────────────────────────

export function toPercent(completed: number, total: number): number {
	if (total === 0) return 0;
	return Math.round((completed / total) * 100);
}
