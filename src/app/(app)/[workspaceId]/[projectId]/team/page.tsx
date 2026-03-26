import { TeamPageClient } from "@/components/team/team-page";
import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/permissions/tier-checks";
import { getTeamStats, getWorkspaceMembers } from "@/lib/queries/team";
import { redirect } from "next/navigation";

interface TeamPageProps {
	params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function TeamPage({ params }: TeamPageProps) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId } = await params;

	// Fetch data in parallel
	const [members, stats, admin] = await Promise.all([
		getWorkspaceMembers(workspaceId),
		getTeamStats(workspaceId),
		isAdmin(session.user.id, workspaceId),
	]);

	return (
		<TeamPageClient
			members={members}
			stats={stats}
			workspaceId={workspaceId}
			currentUserId={session.user.id}
			isAdmin={admin}
		/>
	);
}
