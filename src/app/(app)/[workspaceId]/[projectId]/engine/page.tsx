import { EngineListPage } from "@/components/engine/engine-list-page";
import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import {
	getEngineList,
	getProjectInsightAuthors,
	getProjectThemeTags,
} from "@/lib/queries/engine-list";
import { redirect } from "next/navigation";

interface EnginePageProps {
	params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function EnginePage({ params }: EnginePageProps) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	// Permission check — engine read required
	const readPerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "engine",
		action: "read",
	});

	if (!readPerm.allowed) {
		return (
			<div className="p-8">
				<p style={{ fontFamily: "var(--font-body)", color: "var(--color-status-error)" }}>
					{readPerm.reason ?? "You don't have access to the Insight Engine."}
				</p>
			</div>
		);
	}

	// Check write permission for create/edit/delete buttons
	const writePerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "engine",
		action: "write",
	});

	// Fetch initial data + filter options in parallel
	const [initialData, themeTags, authors] = await Promise.all([
		getEngineList(projectId, { sortBy: "confidence_desc", limit: 20 }),
		getProjectThemeTags(projectId),
		getProjectInsightAuthors(projectId),
	]);

	return (
		<EngineListPage
			initialData={initialData}
			workspaceId={workspaceId}
			projectId={projectId}
			canEdit={writePerm.allowed}
			themeTags={themeTags}
			authors={authors}
		/>
	);
}
