"use client";

import { seedDemoWorkspaceAction } from "@/actions/onboarding";
import { FolderOpen, Play } from "lucide-react";
import { useState } from "react";

interface EmptyWorkspaceProps {
	workspaceName: string;
}

export function EmptyWorkspace({ workspaceName }: EmptyWorkspaceProps) {
	const [seedingDemo, setSeedingDemo] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleSeedDemo() {
		setSeedingDemo(true);
		setError(null);
		const result = await seedDemoWorkspaceAction();
		setSeedingDemo(false);
		if (result.error) {
			setError(result.error);
			return;
		}
		window.location.href = `/${result.workspaceId}`;
	}

	return (
		<div className="flex flex-1 items-center justify-center">
			<div className="text-center max-w-sm px-6">
				<div
					className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
					style={{
						backgroundColor: "var(--color-accent-gold-muted)",
						border: "1px solid var(--color-accent-gold-border)",
					}}
				>
					<FolderOpen size={28} style={{ color: "var(--color-accent-gold)" }} strokeWidth={1.5} />
				</div>
				<h2
					className="text-xl font-semibold tracking-tight"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					No projects yet
				</h2>
				<p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
					Create your first project from the sidebar to start capturing research and building
					insights.
				</p>

				<div className="mt-6 flex flex-col items-center gap-2">
					<button
						type="button"
						onClick={handleSeedDemo}
						disabled={seedingDemo}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90"
						style={{
							backgroundColor: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-secondary)",
						}}
					>
						<Play size={14} style={{ color: "var(--color-accent-gold)" }} />
						{seedingDemo ? "Creating demo…" : "Explore a demo workspace"}
					</button>
				</div>

				{error && (
					<p className="mt-3 text-sm" style={{ color: "var(--color-status-error)" }}>
						{error}
					</p>
				)}
			</div>
		</div>
	);
}
