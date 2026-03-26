"use client";

import { unlockStackAction } from "@/actions/stack";
import type { ActiveSnapshot } from "@/lib/queries/stack";
import { motion } from "framer-motion";
import { Copy, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

interface LockedBannerProps {
	snapshot: ActiveSnapshot;
	workspaceId: string;
	projectId: string;
	canUnlock: boolean;
}

export function LockedBanner({ snapshot, workspaceId, projectId, canUnlock }: LockedBannerProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [copied, setCopied] = useState(false);

	const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${snapshot.shareToken}`;

	const handleUnlock = useCallback(() => {
		if (!confirm("Are you sure you want to unlock the stack? The share link will stop working.")) {
			return;
		}
		startTransition(async () => {
			const result = await unlockStackAction({
				workspaceId,
				projectId,
				snapshotId: snapshot.id,
			});
			if ("success" in result) {
				router.refresh();
			}
		});
	}, [workspaceId, projectId, snapshot.id, router]);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [shareUrl]);

	const lockedDate = new Intl.DateTimeFormat("en-GB", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(snapshot.lockedAt);

	return (
		<motion.div
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 400, damping: 30 }}
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 12,
				padding: "12px 16px",
				background: "var(--color-accent-green-muted)",
				border: "1px solid var(--color-accent-green)",
				borderRadius: "var(--radius-lg)",
				marginBottom: 16,
			}}
		>
			<div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
				<Lock size={16} style={{ color: "var(--color-accent-green)", flexShrink: 0 }} />
				<div style={{ minWidth: 0 }}>
					<p
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-primary)",
							margin: 0,
						}}
					>
						Stack locked by <strong>{snapshot.lockedByName}</strong> on {lockedDate}
					</p>
					<p
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-muted)",
							margin: 0,
							marginTop: 2,
						}}
					>
						Mode: {snapshot.shareViewMode} · Editing disabled while locked
					</p>
				</div>
			</div>

			<div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
				{/* Copy share link */}
				<button
					type="button"
					onClick={handleCopy}
					title="Copy share link"
					style={{
						display: "flex",
						alignItems: "center",
						gap: 4,
						padding: "6px 10px",
						fontFamily: "var(--font-mono)",
						fontSize: "var(--text-xs)",
						background: "transparent",
						border: "1px solid var(--color-accent-green)",
						borderRadius: "var(--radius-md)",
						color: "var(--color-accent-green)",
						cursor: "pointer",
					}}
				>
					<Copy size={12} />
					{copied ? "Copied" : "Link"}
				</button>

				{/* Unlock button */}
				{canUnlock && (
					<button
						type="button"
						onClick={handleUnlock}
						disabled={isPending}
						style={{
							display: "flex",
							alignItems: "center",
							gap: 4,
							padding: "6px 10px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "var(--color-status-error-muted, rgba(239, 68, 68, 0.1))",
							border: "1px solid var(--color-status-error)",
							borderRadius: "var(--radius-md)",
							color: "var(--color-status-error)",
							cursor: isPending ? "wait" : "pointer",
							opacity: isPending ? 0.6 : 1,
						}}
					>
						<Unlock size={14} />
						{isPending ? "Unlocking..." : "Unlock"}
					</button>
				)}
			</div>
		</motion.div>
	);
}
