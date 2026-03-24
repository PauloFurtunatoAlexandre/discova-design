import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workspaceMembers } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function AppHomePage() {
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/login");
	}

	const memberships = await db.query.workspaceMembers.findMany({
		where: and(eq(workspaceMembers.userId, session.user.id), isNull(workspaceMembers.removedAt)),
		with: { workspace: true },
	});

	if (memberships.length === 0) {
		redirect("/onboarding");
	}

	// Match the same selection logic as the app layout
	const active = memberships.find((m) => !m.workspace.isDemo) ?? memberships[0];
	redirect(`/${active.workspace.id}`);
}
