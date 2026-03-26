import { EmptyWorkspace } from "@/components/dashboard/empty-workspace";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, workspaces } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function WorkspaceRootPage({
	params,
}: {
	params: Promise<{ workspaceId: string }>;
}) {
	const { workspaceId } = await params;
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	// Redirect to the first project if one exists
	const firstProject = await db.query.projects.findFirst({
		where: and(eq(projects.workspaceId, workspaceId), isNull(projects.archivedAt)),
		orderBy: (p, { asc }) => [asc(p.createdAt)],
		columns: { id: true },
	});

	if (firstProject) {
		redirect(`/${workspaceId}/${firstProject.id}`);
	}

	// Get workspace name for empty state
	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
		columns: { name: true },
	});

	return <EmptyWorkspace workspaceName={workspace?.name ?? "Workspace"} />;
}
