"use client";

import { PasscodeGate } from "@/components/share/passcode-gate";
import { StakeholderView } from "@/components/share/stakeholder-view";
import type { StackItemWithNode } from "@/lib/queries/stack";
import { useCallback, useState } from "react";

interface SharePageClientProps {
	token: string;
	exists: boolean;
}

export function SharePageClient({ token, exists }: SharePageClientProps) {
	const [authenticated, setAuthenticated] = useState(false);
	const [snapshotData, setSnapshotData] = useState<StackItemWithNode[] | null>(null);
	const [viewMode, setViewMode] = useState<"stakeholder" | "presentation">("stakeholder");

	const handleAuthenticated = useCallback(
		(data: StackItemWithNode[], mode: "stakeholder" | "presentation") => {
			setSnapshotData(data);
			setViewMode(mode);
			setAuthenticated(true);
		},
		[],
	);

	if (!exists) {
		return (
			<div
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "var(--color-bg-base)",
				}}
			>
				<div
					style={{
						textAlign: "center",
						padding: 32,
					}}
				>
					<h1
						style={{
							fontFamily: "var(--font-display)",
							fontSize: "var(--text-xl)",
							color: "var(--color-text-primary)",
							marginBottom: 8,
						}}
					>
						Link expired or invalid
					</h1>
					<p
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-secondary)",
						}}
					>
						This share link is no longer active. The stack may have been unlocked.
					</p>
				</div>
			</div>
		);
	}

	if (!authenticated || !snapshotData) {
		return <PasscodeGate token={token} onAuthenticated={handleAuthenticated} />;
	}

	return <StakeholderView items={snapshotData} viewMode={viewMode} />;
}
