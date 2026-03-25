"use client";

import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyProjectProps {
	workspaceId: string;
	projectId: string;
	projectName: string;
}

export function EmptyProject({ workspaceId, projectId, projectName }: EmptyProjectProps) {
	const router = useRouter();

	return (
		<div className="flex flex-col items-center justify-center py-20 text-center px-4">
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
				className="text-xl font-semibold mb-2"
				style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
			>
				{projectName} is ready
			</h2>

			<p
				className="text-sm max-w-xs leading-relaxed mb-8"
				style={{ color: "var(--color-text-secondary)" }}
			>
				Start by adding your first research note. Everything else — insights, maps, priorities —
				flows from here.
			</p>

			<button
				type="button"
				onClick={() => router.push(`/${workspaceId}/${projectId}/vault`)}
				className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
				style={{
					background: "var(--color-accent-gold)",
					color: "var(--color-text-inverse)",
				}}
			>
				<FileText size={15} strokeWidth={2} />
				Add first note
			</button>
		</div>
	);
}
