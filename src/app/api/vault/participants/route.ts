import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { researchNotes } from "@/lib/db/schema";
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
