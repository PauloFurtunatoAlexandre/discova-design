import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, researchNotes } from "@/lib/db/schema";
import { checkPermission } from "@/lib/permissions";
import { and, eq, ilike } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const q = searchParams.get("q") ?? "";
	const projectId = searchParams.get("projectId");

	if (!projectId) {
		return NextResponse.json({ error: "projectId required" }, { status: 400 });
	}

	const [project] = await db
		.select({ workspaceId: projects.workspaceId })
		.from(projects)
		.where(eq(projects.id, projectId))
		.limit(1);

	if (!project) {
		return NextResponse.json({ error: "Project not found" }, { status: 404 });
	}

	const permission = await checkPermission({
		userId: session.user.id,
		workspaceId: project.workspaceId,
		projectId,
		phase: "vault",
		action: "read",
	});

	if (!permission.allowed) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	const results = await db
		.selectDistinct({ name: researchNotes.participantName })
		.from(researchNotes)
		.where(
			and(eq(researchNotes.projectId, projectId), ilike(researchNotes.participantName, `${q}%`)),
		)
		.orderBy(researchNotes.participantName)
		.limit(10);

	return NextResponse.json(results.map((r) => r.name));
}
