import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workspaceMembers, workspaces } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import slugify from "slugify";
import { OnboardingWizard } from "./onboarding-wizard";

export const metadata: Metadata = {
	title: "Welcome — Discova",
};

export default async function OnboardingPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	let membership = await db.query.workspaceMembers.findFirst({
		where: and(eq(workspaceMembers.userId, session.user.id), isNull(workspaceMembers.removedAt)),
		with: { workspace: true },
	});

	// Authenticated but no workspace — can happen if a Google OAuth user's
	// createUser event failed. Recover by creating one now.
	if (!membership) {
		const userName = session.user.name ?? "My";
		const workspaceName = `${userName}'s Workspace`;
		const base = slugify(workspaceName, { lower: true, strict: true, trim: true }) || "workspace";

		const [ws] = await db
			.insert(workspaces)
			.values({ name: workspaceName, slug: `${base}-${nanoid(4)}`, createdBy: session.user.id })
			.returning({ id: workspaces.id, name: workspaces.name });

		if (!ws) redirect("/login");

		await db.insert(workspaceMembers).values({
			workspaceId: ws.id,
			userId: session.user.id,
			tier: "admin",
			workspacePreset: "member",
			invitedBy: session.user.id,
			inviteAcceptedAt: new Date(),
		});

		membership = await db.query.workspaceMembers.findFirst({
			where: eq(workspaceMembers.workspaceId, ws.id),
			with: { workspace: true },
		});

		if (!membership) redirect("/login");
	}

	return (
		<OnboardingWizard
			workspace={{ id: membership.workspace.id, name: membership.workspace.name }}
			userName={session.user.name ?? ""}
		/>
	);
}
