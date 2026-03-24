"use client";

import type { Phase, PhasePermission, ResolvedPreset, Tier } from "@/lib/permissions/types";
import { useQuery } from "@tanstack/react-query";

interface PermissionsResponse {
	tier: Tier | null;
	preset: ResolvedPreset;
	phases: Record<Phase, PhasePermission>;
}

async function fetchPermissions(
	workspaceId: string,
	projectId: string,
): Promise<PermissionsResponse> {
	const params = new URLSearchParams({ workspaceId, projectId });
	const res = await fetch(`/api/permissions?${params.toString()}`);

	if (!res.ok) {
		throw new Error("Failed to fetch permissions");
	}

	return res.json();
}

/**
 * Client-side permissions hook.
 *
 * ⚠ This is for UI rendering ONLY. It caches for 5 minutes.
 *   Server Actions always re-verify permissions independently.
 *   Never rely on this hook for security decisions.
 */
export function usePermissions(workspaceId: string, projectId: string, phase: Phase) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["permissions", workspaceId, projectId],
		queryFn: () => fetchPermissions(workspaceId, projectId),
		staleTime: 5 * 60 * 1000, // 5 minutes
		gcTime: 10 * 60 * 1000, // 10 minutes
		retry: 1,
	});

	const phasePermission = data?.phases[phase] ?? "none";

	return {
		canEdit: phasePermission === "write",
		canView: phasePermission === "write" || phasePermission === "read",
		tier: data?.tier ?? null,
		preset: data?.preset ?? "no_access",
		isLoading,
		error,
	};
}

/**
 * Get all phase permissions at once (for sidebar navigation, dashboard, etc.)
 */
export function useAllPermissions(workspaceId: string, projectId: string) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["permissions", workspaceId, projectId],
		queryFn: () => fetchPermissions(workspaceId, projectId),
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
		retry: 1,
	});

	return {
		tier: data?.tier ?? null,
		preset: data?.preset ?? "no_access",
		phases: data?.phases ?? {
			vault: "none" as PhasePermission,
			engine: "none" as PhasePermission,
			map: "none" as PhasePermission,
			stack: "none" as PhasePermission,
			team: "none" as PhasePermission,
		},
		isLoading,
		error,
	};
}
