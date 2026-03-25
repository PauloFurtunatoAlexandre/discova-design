import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { researchNotes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function NoteDocumentPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string; noteId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId, noteId } = await params;

	const note = await db.query.researchNotes.findFirst({
		where: and(eq(researchNotes.id, noteId), eq(researchNotes.projectId, projectId)),
	});

	if (!note) redirect(`/${workspaceId}/${projectId}/vault`);

	const displayDate = new Date(`${note.sessionDate}T12:00:00`).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});

	return (
		<div className="mx-auto max-w-3xl p-8">
			<Link
				href={`/${workspaceId}/${projectId}/vault`}
				className="mb-8 inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-75"
				style={{ color: "var(--color-text-muted)" }}
			>
				<ArrowLeft size={14} strokeWidth={2} />
				Back to Vault
			</Link>

			<div
				className="rounded-2xl p-8"
				style={{
					background: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-subtle)",
				}}
			>
				<div className="mb-6 flex items-start gap-4">
					<div
						className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
						style={{
							background: "var(--color-accent-gold-muted)",
							border: "1px solid var(--color-accent-gold-border)",
						}}
					>
						<FileText size={18} style={{ color: "var(--color-accent-gold)" }} strokeWidth={1.5} />
					</div>
					<div>
						<h1
							className="text-xl font-semibold"
							style={{
								fontFamily: "var(--font-display)",
								color: "var(--color-text-primary)",
							}}
						>
							{note.participantName}
						</h1>
						<p
							className="mt-0.5 text-sm"
							style={{
								fontFamily: "var(--font-mono)",
								color: "var(--color-text-muted)",
							}}
						>
							{displayDate}
							{note.researchMethod && ` · ${note.researchMethod.replace("_", " ")}`}
						</p>
					</div>
				</div>

				<div
					className="whitespace-pre-wrap text-sm leading-relaxed"
					style={{ color: "var(--color-text-primary)", lineHeight: "1.7" }}
				>
					{note.rawContent}
				</div>

				{/* Metadata summary */}
				{(note.userSegment || note.emotionalTone || note.followUpNeeded) && (
					<div
						className="mt-8 flex flex-wrap gap-2 border-t pt-6"
						style={{ borderColor: "var(--color-border-subtle)" }}
					>
						{note.userSegment && (
							<span
								className="rounded-md px-3 py-1 text-xs"
								style={{
									background: "var(--color-bg-raised)",
									border: "1px solid var(--color-border-subtle)",
									color: "var(--color-text-secondary)",
								}}
							>
								{note.userSegment}
							</span>
						)}
						{note.emotionalTone && (
							<span
								className="rounded-md px-3 py-1 text-xs capitalize"
								style={{
									background: "var(--color-bg-raised)",
									border: "1px solid var(--color-border-subtle)",
									color: "var(--color-text-secondary)",
								}}
							>
								{note.emotionalTone}
							</span>
						)}
						{note.followUpNeeded && (
							<span
								className="rounded-md px-3 py-1 text-xs"
								style={{
									background: "var(--color-status-warning-bg)",
									border: "1px solid var(--color-status-warning)",
									color: "var(--color-status-warning)",
								}}
							>
								Follow-up needed
							</span>
						)}
					</div>
				)}
			</div>

			<p className="mt-6 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
				Full document editor coming in Prompt 11
			</p>
		</div>
	);
}
