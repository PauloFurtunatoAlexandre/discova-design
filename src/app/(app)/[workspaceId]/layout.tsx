import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
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

	// Verify user is an active member of this workspace
	const membership = await db.query.workspaceMembers.findFirst({
		where: and(
			eq(workspaceMembers.userId, session.user.id),
			eq(workspaceMembers.workspaceId, workspaceId),
			isNull(workspaceMembers.removedAt),
		),
	});

	if (!membership) {
		redirect("/onboarding");
	}

	return <>{children}</>;
}
