import { NoteWizard } from "@/components/vault/note-wizard";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";

export default async function NewNotePage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	return (
		<div className="mx-auto max-w-3xl p-8" style={{ minHeight: "calc(100vh - 56px)" }}>
			<NoteWizard workspaceId={workspaceId} projectId={projectId} />
		</div>
	);
}
