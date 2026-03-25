import { NoteDocumentView } from "@/components/vault/note-document-view";
import { auth } from "@/lib/auth/config";
import { checkPermission } from "@/lib/permissions";
import { getNoteWithRelations } from "@/lib/queries/vault";
import { notFound, redirect } from "next/navigation";

export default async function NoteDocumentPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string; noteId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId, noteId } = await params;

	// Check read access
	const readPerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "vault",
		action: "read",
	});

	if (!readPerm.allowed) redirect(`/${workspaceId}`);

	// Check write access for read-only mode detection
	const writePerm = await checkPermission({
		userId: session.user.id,
		workspaceId,
		projectId,
		phase: "vault",
		action: "write",
	});

	// Fetch note with all relations
	const note = await getNoteWithRelations(noteId);

	// IDOR guard — note must belong to the project in the URL
	if (!note || note.projectId !== projectId) notFound();

	return (
		<NoteDocumentView
			note={note}
			workspaceId={workspaceId}
			projectId={projectId}
			canEdit={writePerm.allowed}
		/>
	);
}
