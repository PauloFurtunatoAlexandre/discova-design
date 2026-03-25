import { EmptyProject } from "@/components/dashboard/empty-project";
import { PhaseRings } from "@/components/dashboard/phase-rings";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { getDashboardData } from "@/lib/queries/dashboard";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function ProjectDashboardPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	const project = await db.query.projects.findFirst({
		where: and(
			eq(projects.id, projectId),
			eq(projects.workspaceId, workspaceId),
			isNull(projects.archivedAt),
		),
		columns: { id: true, name: true },
	});

	if (!project) redirect(`/${workspaceId}`);

	const data = await getDashboardData(projectId, workspaceId);

	return (
		<div className="flex flex-col gap-10 p-8 max-w-4xl">
			{/* Header */}
			<div>
				<h1
					className="text-2xl font-semibold"
					style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}
				>
					{project.name}
				</h1>
				<p className="text-sm mt-1" style={{ color: "var(--color-text-muted)" }}>
					Project overview
				</p>
			</div>

			{data.hasAnyData ? (
				<>
					{/* Phase progress rings */}
					<section>
						<h2
							className="text-xs font-semibold uppercase tracking-widest mb-5"
							style={{ color: "var(--color-text-muted)" }}
						>
							Phase progress
						</h2>
						<PhaseRings data={data} workspaceId={workspaceId} projectId={projectId} />
					</section>

					{/* Quick actions */}
					<section>
						<h2
							className="text-xs font-semibold uppercase tracking-widest mb-4"
							style={{ color: "var(--color-text-muted)" }}
						>
							Quick actions
						</h2>
						<QuickActions workspaceId={workspaceId} projectId={projectId} />
					</section>
				</>
			) : (
				<EmptyProject workspaceId={workspaceId} projectId={projectId} projectName={project.name} />
			)}
		</div>
	);
}
