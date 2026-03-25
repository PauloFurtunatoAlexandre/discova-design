import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import { type VaultListFilters, getVaultList } from "@/lib/queries/vault-list";
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

	const permission = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "vault",
		action: "read",
	});

	if (!permission.allowed) {
		return NextResponse.json({ error: "Access denied" }, { status: 403 });
	}

	const rawLimit = Number.parseInt(searchParams.get("limit") ?? "20", 10);
	const limit = Number.isNaN(rawLimit) || rawLimit < 1 || rawLimit > 100 ? 20 : rawLimit;

	const sortParam = searchParams.get("sort");
	const validSorts = [
		"newest",
		"oldest",
		"participant_asc",
		"participant_desc",
		"quote_count",
		"follow_up_first",
	] as const;
	const sortBy = validSorts.includes(sortParam as (typeof validSorts)[number])
		? (sortParam as VaultListFilters["sortBy"])
		: "newest";

	const filters: VaultListFilters = {
		search: searchParams.get("search") ?? undefined,
		researchMethod: searchParams.getAll("method").filter(Boolean),
		emotionalTone: searchParams.get("tone") ?? undefined,
		dateFrom: searchParams.get("dateFrom") ?? undefined,
		dateTo: searchParams.get("dateTo") ?? undefined,
		followUpNeeded: searchParams.get("followUp") === "true" ? true : undefined,
		tags: searchParams.getAll("tag").filter(Boolean),
		sortBy,
		cursor: searchParams.get("cursor") ?? undefined,
		limit,
	};

	const result = await getVaultList(projectId, filters);
	return NextResponse.json(result);
}
