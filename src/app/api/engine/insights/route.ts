import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import { type EngineListFilters, getEngineList } from "@/lib/queries/engine-list";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const workspaceId = searchParams.get("workspaceId");
	const projectId = searchParams.get("projectId");

	if (!workspaceId || !projectId) {
		return NextResponse.json({ error: "workspaceId and projectId required" }, { status: 400 });
	}

	// Permission check: Engine read
	const permission = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "engine",
		action: "read",
	});

	if (!permission.allowed) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 });
	}

	// Parse filters
	const filters: EngineListFilters = {
		themeTag: searchParams.get("themeTag") || undefined,
		confidenceMin: searchParams.get("confMin")
			? Number.parseInt(searchParams.get("confMin") as string, 10)
			: undefined,
		confidenceMax: searchParams.get("confMax")
			? Number.parseInt(searchParams.get("confMax") as string, 10)
			: undefined,
		connectionStatus:
			(searchParams.get("connection") as EngineListFilters["connectionStatus"]) || "all",
		authorId: searchParams.get("author") || undefined,
		search: searchParams.get("search") || undefined,
		sortBy: (searchParams.get("sort") as EngineListFilters["sortBy"]) || "confidence_desc",
		cursor: searchParams.get("cursor") || undefined,
		limit: Number.parseInt(searchParams.get("limit") || "20", 10),
	};

	const result = await getEngineList(projectId, filters);
	return NextResponse.json(result);
}
