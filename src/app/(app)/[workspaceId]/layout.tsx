import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function WorkspaceLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ workspaceId: string }>;
}) {
	const { workspaceId } = await params;
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/login");
	}

	// Fetch all active memberships to build the workspace switcher
	const memberships = await db.query.workspaceMembers.findMany({
		where: and(eq(workspaceMembers.userId, session.user.id), isNull(workspaceMembers.removedAt)),
		with: { workspace: true },
	});

	if (memberships.length === 0) {
		redirect("/onboarding");
	}

	// Find membership for the workspace in the URL
	const currentMembership = memberships.find((m) => m.workspaceId === workspaceId);
	if (!currentMembership) {
		redirect("/onboarding");
	}

	const workspace = currentMembership.workspace;

	// All workspaces for the switcher dropdown
	const allWorkspaces = memberships.map((m) => ({
		id: m.workspace.id,
		name: m.workspace.name,
		slug: m.workspace.slug,
		logoUrl: m.workspace.logoUrl,
		isDemo: m.workspace.isDemo,
		tier: m.tier,
	}));

	// Projects for this specific workspace (not the "active" workspace)
	const workspaceProjects = await db.query.projects.findMany({
		where: and(eq(projects.workspaceId, workspaceId), isNull(projects.archivedAt)),
		orderBy: (p, { desc }) => [desc(p.createdAt)],
	});

	return (
		<AppShell
			workspace={{
				id: workspace.id,
				name: workspace.name,
				slug: workspace.slug,
				logoUrl: workspace.logoUrl,
			}}
			allWorkspaces={allWorkspaces}
			projects={workspaceProjects.map((p) => ({
				id: p.id,
				name: p.name,
				slug: p.slug,
			}))}
			user={{
				id: session.user.id,
				name: session.user.name ?? null,
				email: session.user.email ?? null,
				image: session.user.image ?? null,
			}}
			userTier={currentMembership.tier}
		>
			{children}
		</AppShell>
	);
}
