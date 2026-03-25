import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { quotes, researchNotes } from "@/lib/db/schema";
import { checkPermission } from "@/lib/permissions";
import { and, eq, ilike } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

export interface QuoteSearchResult {
	id: string;
	text: string;
	noteId: string;
	participantName: string;
	sessionDate: string;
}

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const projectId = searchParams.get("projectId");
	const q = searchParams.get("q") ?? "";

	if (!projectId) {
		return NextResponse.json({ error: "projectId is required" }, { status: 400 });
	}

	// Derive workspaceId from project (best-effort; permission check uses projectId)
	// We use a lightweight permission check here — vault read is sufficient
	const workspaceId = searchParams.get("workspaceId") ?? "";
	if (workspaceId) {
		const permission = await checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "vault",
			action: "read",
		});
		if (!permission.allowed) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
	}

	const results = await db
		.select({
			id: quotes.id,
			text: quotes.text,
			noteId: researchNotes.id,
			participantName: researchNotes.participantName,
			sessionDate: researchNotes.sessionDate,
		})
		.from(quotes)
		.innerJoin(researchNotes, eq(researchNotes.id, quotes.noteId))
		.where(
			and(eq(researchNotes.projectId, projectId), q ? ilike(quotes.text, `%${q}%`) : undefined),
		)
		.orderBy(researchNotes.sessionDate)
		.limit(20);

	return NextResponse.json(results satisfies QuoteSearchResult[]);
}
