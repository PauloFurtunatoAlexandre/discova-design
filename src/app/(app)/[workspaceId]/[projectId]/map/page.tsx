import { MapCanvasLazy } from "@/components/map/map-canvas-lazy";
import { auth } from "@/lib/auth/config";
import { calculateLayout } from "@/lib/map/layout";
import { checkPermission } from "@/lib/permissions";
import { getMapData, getUnplacedInsights } from "@/lib/queries/map";
import { redirect } from "next/navigation";

export default async function MapPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	const permission = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "map",
		action: "read",
	});
	if (!permission.allowed) redirect(`/${workspaceId}`);

	const writePermission = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "map",
		action: "write",
	});

	const [rawData, unplacedInsights] = await Promise.all([
		getMapData(projectId),
		writePermission.allowed ? getUnplacedInsights(projectId) : Promise.resolve([]),
	]);

	const layoutNodes = calculateLayout(rawData.nodes);

	return (
		<div className="h-[calc(100vh-var(--topbar-height))] w-full overflow-hidden">
			<MapCanvasLazy
				mapData={{ nodes: layoutNodes, connections: rawData.connections }}
				canEdit={writePermission.allowed}
				workspaceId={workspaceId}
				projectId={projectId}
				unplacedInsights={unplacedInsights}
			/>
		</div>
	);
}
