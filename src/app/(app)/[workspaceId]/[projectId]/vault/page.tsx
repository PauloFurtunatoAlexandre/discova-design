import { VaultListPage } from "@/components/vault/vault-list-page";
import { auth } from "@/lib/auth/config";
import { checkPermission, resolvePreset } from "@/lib/permissions";
import { getVaultList } from "@/lib/queries/vault-list";
import { redirect } from "next/navigation";

export default async function VaultPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	const [readAccess, writeAccess] = await Promise.all([
		checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "vault",
			action: "read",
		}),
		checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "vault",
			action: "write",
		}),
	]);

	if (!readAccess.allowed) redirect(`/${workspaceId}`);

	const [initialData, preset] = await Promise.all([
		getVaultList(projectId, { limit: 20, sortBy: "newest" }),
		resolvePreset(session.user.id, projectId, workspaceId),
	]);

	return (
		<VaultListPage
			initialData={initialData}
			workspaceId={workspaceId}
			projectId={projectId}
			canEdit={writeAccess.allowed}
			userPreset={preset}
		/>
	);
}
