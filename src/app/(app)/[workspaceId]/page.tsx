import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
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

	// No projects yet — show empty state
	return (
		<div className="flex flex-1 items-center justify-center">
			<div className="text-center max-w-sm px-6">
				<div
					className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-3xl"
					style={{ backgroundColor: "var(--color-bg-raised)", border: "1px solid var(--color-border-subtle)" }}
				>
					📂
				</div>
				<h2
					className="text-xl font-semibold tracking-tight"
					style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
				>
					No projects yet
				</h2>
				<p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
					Create your first project to start capturing research and building insights.
				</p>
			</div>
		</div>
	);
}
