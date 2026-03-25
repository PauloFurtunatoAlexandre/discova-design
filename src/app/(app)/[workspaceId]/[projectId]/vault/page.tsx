import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { researchNotes } from "@/lib/db/schema";
import { checkPermission } from "@/lib/permissions";
import { count, eq } from "drizzle-orm";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function VaultPage({
	params,
}: {
	params: Promise<{ workspaceId: string; projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/login");

	const { workspaceId, projectId } = await params;

	const [noteCountResult, vaultAccess] = await Promise.all([
		db.select({ count: count() }).from(researchNotes).where(eq(researchNotes.projectId, projectId)),
		checkPermission({
			userId: session.user.id,
			workspaceId,
			projectId,
			phase: "vault",
			action: "write",
		}),
	]);

	const noteCount = Number(noteCountResult[0]?.count ?? 0);
	const canWrite = vaultAccess.allowed;
	const isEmpty = noteCount === 0;

	return (
		<div className="relative flex flex-col gap-8 p-8">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1
						style={{
							fontFamily: "var(--font-display)",
							fontSize: "1.5rem",
							color: "var(--color-text-primary)",
						}}
					>
						Research Vault
					</h1>
					<p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
						{noteCount === 0 ? "No notes yet" : `${noteCount} note${noteCount === 1 ? "" : "s"}`}
					</p>
				</div>

				{canWrite && (
					<Link
						href={`/${workspaceId}/${projectId}/vault/new`}
						className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none"
						style={{
							background: "var(--color-accent-gold)",
							color: "var(--color-text-inverse)",
						}}
					>
						<Plus size={15} strokeWidth={2.5} />
						Add Note
					</Link>
				)}
			</div>

			{/* Empty state */}
			{isEmpty && (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div
						className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
						style={{
							background: "var(--color-accent-gold-muted)",
							border: "1px solid var(--color-accent-gold-border)",
						}}
					>
						<FileText size={28} style={{ color: "var(--color-accent-gold)" }} strokeWidth={1.5} />
					</div>

					<h2
						className="mb-2 text-xl font-semibold"
						style={{
							fontFamily: "var(--font-display)",
							color: "var(--color-text-primary)",
						}}
					>
						Your research vault is empty
					</h2>
					<p
						className="mb-8 max-w-xs text-sm leading-relaxed"
						style={{ color: "var(--color-text-secondary)" }}
					>
						Add your first research note to start capturing insights.
					</p>

					{canWrite && (
						<Link
							href={`/${workspaceId}/${projectId}/vault/new`}
							className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none"
							style={{
								background: "var(--color-accent-gold)",
								color: "var(--color-text-inverse)",
							}}
						>
							<FileText size={15} strokeWidth={2} />
							Add your first note →
						</Link>
					)}
				</div>
			)}

			{/* Note list placeholder — full list built in Prompt 13 */}
			{!isEmpty && (
				<div className="flex flex-col gap-2">
					<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
						{noteCount} note{noteCount === 1 ? "" : "s"} — full list coming in Prompt 13.
					</p>
				</div>
			)}

			{/* FAB — fixed bottom-right */}
			{canWrite && (
				<Link
					href={`/${workspaceId}/${projectId}/vault/new`}
					className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]"
					style={{
						background: "var(--color-accent-gold)",
						color: "var(--color-text-inverse)",
						boxShadow: "0 4px 16px rgba(232, 197, 71, 0.35)",
					}}
					aria-label="Add research note"
				>
					<Plus size={22} strokeWidth={2.5} />
				</Link>
			)}
		</div>
	);
}
