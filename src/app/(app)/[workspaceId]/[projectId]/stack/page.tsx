import { StackPageClient } from "@/components/stack/stack-page";
import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import {
	getActiveSnapshot,
	getStackItems,
	getStackStats,
	syncSolutionNodesToStack,
} from "@/lib/queries/stack";
import { redirect } from "next/navigation";

interface StackPageProps {
	params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function StackPage({ params }: StackPageProps) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	// Permission check — stack read required
	const readPerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "stack",
		action: "read",
	});

	if (!readPerm.allowed) {
		return (
			<div className="p-8">
				<p style={{ fontFamily: "var(--font-body)", color: "var(--color-status-error)" }}>
					{readPerm.reason ?? "You don't have access to the Priority Stack."}
				</p>
			</div>
		);
	}

	// Check write permission
	const writePerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "stack",
		action: "write",
	});

	// Auto-sync solution nodes on page load (idempotent)
	await syncSolutionNodesToStack(projectId);

	// Fetch stack items, stats, and active snapshot in parallel
	const [items, stats, activeSnapshot] = await Promise.all([
		getStackItems(projectId, "rice_desc"),
		getStackStats(projectId),
		getActiveSnapshot(projectId),
	]);

	// Determine if current user can unlock (locker or admin)
	const isLockerOrAdmin =
		activeSnapshot?.lockedBy === session.user.id ||
		(await checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "stack",
			action: "write",
		}).then((p) => p.allowed));

	return (
		<StackPageClient
			items={items}
			stats={stats}
			workspaceId={workspaceId}
			projectId={projectId}
			canEdit={writePerm.allowed}
			activeSnapshot={activeSnapshot}
			isLockerOrAdmin={isLockerOrAdmin}
		/>
	);
}
