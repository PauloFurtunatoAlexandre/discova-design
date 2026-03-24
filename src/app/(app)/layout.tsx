import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/login");
	}

	// Get user's active workspace memberships
	const memberships = await db.query.workspaceMembers.findMany({
		where: and(eq(workspaceMembers.userId, session.user.id), isNull(workspaceMembers.removedAt)),
		with: {
			workspace: true,
		},
	});

	// No workspace — send to onboarding
	if (memberships.length === 0) {
		redirect("/onboarding");
	}

	// Use first non-demo workspace as default, fall back to first
	const activeMembership = memberships.find((m) => !m.workspace.isDemo) ?? memberships[0];

	if (!activeMembership) {
		redirect("/onboarding");
	}

	const activeWorkspace = activeMembership.workspace;

	// Get projects for the active workspace
	const workspaceProjects = await db.query.projects.findMany({
		where: and(eq(projects.workspaceId, activeWorkspace.id), isNull(projects.archivedAt)),
		orderBy: (p, { desc }) => [desc(p.createdAt)],
	});

	return (
		<QueryProvider>
			<AppShell
				workspace={{
					id: activeWorkspace.id,
					name: activeWorkspace.name,
					slug: activeWorkspace.slug,
					logoUrl: activeWorkspace.logoUrl,
				}}
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
				userTier={activeMembership.tier}
			>
				{children}
			</AppShell>
		</QueryProvider>
	);
}
