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

	const membership = await db.query.workspaceMembers.findFirst({
		where: and(eq(workspaceMembers.userId, session.user.id), isNull(workspaceMembers.removedAt)),
		with: { workspace: true },
	});

	if (!membership) {
		redirect("/onboarding");
	}

	// Redirect to the user's first workspace
	redirect(`/${membership.workspace.id}`);
}
