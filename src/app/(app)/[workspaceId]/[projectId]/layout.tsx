import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function ProjectLayout({
	children,
	params,
}: {
	children: ReactNode;
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const { workspaceId, projectId } = await params;

	// Verify project belongs to this workspace and is not archived
	const project = await db.query.projects.findFirst({
		where: and(
			eq(projects.id, projectId),
			eq(projects.workspaceId, workspaceId),
			isNull(projects.archivedAt),
		),
		columns: { id: true },
	});

	if (!project) {
		redirect(`/${workspaceId}`);
	}

	return <>{children}</>;
}
