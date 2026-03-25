import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import { getInsightWithRelations } from "@/lib/queries/engine";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ insightId: string }> },
) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { insightId } = await params;
	const { searchParams } = request.nextUrl;
	const workspaceId = searchParams.get("workspaceId");
	const projectId = searchParams.get("projectId");

	if (!workspaceId || !projectId) {
		return NextResponse.json({ error: "workspaceId and projectId are required" }, { status: 400 });
	}

	const permission = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "engine",
		action: "read",
	});

	if (!permission.allowed) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const insight = await getInsightWithRelations(insightId);
	if (!insight) {
		return NextResponse.json({ error: "Insight not found" }, { status: 404 });
	}

	return NextResponse.json(insight);
}
