import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { mapConnections, mapNodes } from "@/lib/db/schema";
import { and, count, eq, ilike } from "drizzle-orm";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
	const session = await auth();
	if (!session?.user?.id) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { searchParams } = request.nextUrl;
	const projectId = searchParams.get("projectId");
	const q = searchParams.get("q") ?? "";

	if (!projectId) {
		return NextResponse.json({ error: "projectId required" }, { status: 400 });
	}

	const problems = await db
		.select({
			id: mapNodes.id,
			label: mapNodes.label,
			description: mapNodes.description,
		})
		.from(mapNodes)
		.where(
			and(
				eq(mapNodes.projectId, projectId),
				eq(mapNodes.type, "problem"),
				q ? ilike(mapNodes.label, `%${q}%`) : undefined,
			),
		)
		.orderBy(mapNodes.label)
		.limit(10);

	const problemsWithCounts = await Promise.all(
		problems.map(async (p) => {
			const [result] = await db
				.select({ count: count() })
				.from(mapConnections)
				.where(eq(mapConnections.targetNodeId, p.id));
			return { ...p, connectedInsightCount: result?.count ?? 0 };
		}),
	);

	return NextResponse.json(problemsWithCounts);
}
