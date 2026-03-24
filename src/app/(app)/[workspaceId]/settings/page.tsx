import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { isAdmin } from "@/lib/permissions";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DangerZone } from "./danger-zone";
import { GeneralSettings } from "./general-settings";

export const metadata: Metadata = {
	title: "Settings — Discova",
};

export default async function WorkspaceSettingsPage({
	params,
}: {
	params: Promise<{ workspaceId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId } = await params;

	const admin = await isAdmin(session.user.id, workspaceId);
	if (!admin) {
		return (
			<div className="flex flex-1 items-center justify-center p-8">
				<div className="text-center max-w-sm">
					<h1
						className="text-2xl font-semibold mb-2"
						style={{
							fontFamily: "var(--font-display)",
							color: "var(--color-text-primary)",
						}}
					>
						Access Denied
					</h1>
					<p style={{ color: "var(--color-text-muted)" }}>
						Only workspace Admins can access settings.
					</p>
				</div>
			</div>
		);
	}

	const workspace = await db.query.workspaces.findFirst({
		where: eq(workspaces.id, workspaceId),
	});

	if (!workspace) redirect("/");

	return (
		<div className="max-w-2xl mx-auto px-8 py-10 space-y-12">
			<div>
				<h1
					className="text-2xl font-semibold"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					Workspace Settings
				</h1>
				<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
					Manage your workspace configuration
				</p>
			</div>

			<GeneralSettings
				workspaceId={workspace.id}
				currentName={workspace.name}
				currentLogoUrl={workspace.logoUrl}
			/>

			<section>
				<h2
					className="text-lg mb-4"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					Members
				</h2>
				<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
					Team management coming in a future update.
				</p>
			</section>

			<DangerZone workspaceId={workspace.id} workspaceName={workspace.name} />
		</div>
	);
}
