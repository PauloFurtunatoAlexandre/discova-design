import { auth } from "@/lib/auth/config";
import { getAllPhasePermissions } from "@/lib/permissions/phase-access";
import { resolvePreset } from "@/lib/permissions/resolve-preset";
import { getTier } from "@/lib/permissions/tier-checks";
import type { Phase, PhasePermission, ResolvedPreset } from "@/lib/permissions/types";
import { type NextRequest, NextResponse } from "next/server";

const PHASES: Phase[] = ["vault", "engine", "map", "stack", "team"];

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const workspaceId = searchParams.get("workspaceId");
	const projectId = searchParams.get("projectId");

	if (!workspaceId || !projectId) {
		return NextResponse.json({ error: "workspaceId and projectId are required" }, { status: 400 });
	}

	const userId = session.user.id;
	const tier = await getTier(userId, workspaceId);

	// Not a member
	if (tier === null) {
		return NextResponse.json({
			tier: null,
			preset: "no_access" as ResolvedPreset,
			phases: Object.fromEntries(PHASES.map((p) => [p, "none"])) as Record<Phase, PhasePermission>,
		});
	}

	// Admin — full access
	if (tier === "admin") {
		return NextResponse.json({
			tier,
			preset: "member" as ResolvedPreset,
			phases: Object.fromEntries(PHASES.map((p) => [p, "write"])) as Record<Phase, PhasePermission>,
		});
	}

	// Viewer — read only everywhere
	if (tier === "viewer") {
		return NextResponse.json({
			tier,
			preset: "no_access" as ResolvedPreset,
			phases: Object.fromEntries(PHASES.map((p) => [p, "read"])) as Record<Phase, PhasePermission>,
		});
	}

	// Member — resolve preset
	const preset = await resolvePreset(userId, projectId, workspaceId);
	const phases = getAllPhasePermissions(preset);

	return NextResponse.json({ tier, preset, phases });
}
