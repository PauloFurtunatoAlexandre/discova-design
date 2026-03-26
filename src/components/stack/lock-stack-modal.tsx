"use client";

import { lockStackAction } from "@/actions/stack";
import { motion } from "framer-motion";
import { Copy, Lock, X } from "lucide-react";
import { useCallback, useState, useTransition } from "react";

interface LockStackModalProps {
	workspaceId: string;
	projectId: string;
	onClose: () => void;
	onLocked: (shareToken: string) => void;
}

export function LockStackModal({ workspaceId, projectId, onClose, onLocked }: LockStackModalProps) {
	const [passcode, setPasscode] = useState("");
	const [viewMode, setViewMode] = useState<"stakeholder" | "presentation">("stakeholder");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();

	const handleLock = useCallback(() => {
		if (!passcode.trim()) {
			setError("Passcode is required");
			return;
		}
		setError(null);
		startTransition(async () => {
			const result = await lockStackAction({
				workspaceId,
				projectId,
				passcode: passcode.trim(),
				viewMode,
			});
			if ("error" in result) {
				setError(result.error);
			} else {
				onLocked(result.shareToken);
			}
		});
	}, [passcode, viewMode, workspaceId, projectId, onLocked]);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--color-overlay-scrim)",
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={() => {}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				exit={{ opacity: 0, scale: 0.95 }}
				transition={{ type: "spring", stiffness: 500, damping: 30 }}
				style={{
					background: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-default)",
					borderRadius: "var(--radius-lg)",
					padding: 24,
					width: "100%",
					maxWidth: 440,
				}}
			>
				{/* Header */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 20,
					}}
				>
					<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
						<Lock size={18} style={{ color: "var(--color-accent-green)" }} />
						<h2
							style={{
								fontFamily: "var(--font-display)",
								fontSize: "var(--text-lg)",
								color: "var(--color-text-primary)",
								margin: 0,
							}}
						>
							Lock & Share Stack
						</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "var(--color-text-muted)",
							padding: 4,
						}}
					>
						<X size={18} />
					</button>
				</div>

				<p
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-secondary)",
						marginBottom: 20,
						lineHeight: 1.5,
					}}
				>
					Locking creates a snapshot of the current RICE scores and tier assignments. Stakeholders
					can view the snapshot via a shareable link with passcode protection.
				</p>

				{/* Passcode input */}
				<div style={{ marginBottom: 16 }}>
					<label
						htmlFor="lock-passcode"
						style={{
							display: "block",
							fontFamily: "var(--font-mono)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
							marginBottom: 6,
						}}
					>
						Share passcode
					</label>
					<input
						id="lock-passcode"
						type="text"
						value={passcode}
						onChange={(e) => setPasscode(e.target.value)}
						placeholder="Enter a passcode for stakeholders"
						style={{
							width: "100%",
							padding: "8px 12px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "var(--color-bg-sunken)",
							border: "1px solid var(--color-border-subtle)",
							borderRadius: "var(--radius-md)",
							color: "var(--color-text-primary)",
							outline: "none",
						}}
						onKeyDown={(e) => e.key === "Enter" && handleLock()}
					/>
				</div>

				{/* View mode */}
				<div style={{ marginBottom: 20 }}>
					<span
						style={{
							display: "block",
							fontFamily: "var(--font-mono)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-muted)",
							textTransform: "uppercase",
							letterSpacing: "0.05em",
							marginBottom: 6,
						}}
					>
						View mode
					</span>
					<div style={{ display: "flex", gap: 8 }}>
						{(["stakeholder", "presentation"] as const).map((mode) => (
							<button
								key={mode}
								type="button"
								onClick={() => setViewMode(mode)}
								style={{
									flex: 1,
									padding: "8px 12px",
									fontFamily: "var(--font-body)",
									fontSize: "var(--text-sm)",
									background:
										viewMode === mode
											? "var(--color-accent-green-muted)"
											: "var(--color-bg-sunken)",
									border: `1px solid ${viewMode === mode ? "var(--color-accent-green)" : "var(--color-border-subtle)"}`,
									borderRadius: "var(--radius-md)",
									color:
										viewMode === mode ? "var(--color-accent-green)" : "var(--color-text-secondary)",
									cursor: "pointer",
									textTransform: "capitalize",
								}}
							>
								{mode}
							</button>
						))}
					</div>
				</div>

				{/* Error */}
				{error && (
					<p
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-status-error)",
							marginBottom: 12,
						}}
					>
						{error}
					</p>
				)}

				{/* Actions */}
				<div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: "8px 16px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "transparent",
							border: "1px solid var(--color-border-subtle)",
							borderRadius: "var(--radius-md)",
							color: "var(--color-text-secondary)",
							cursor: "pointer",
						}}
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={handleLock}
						disabled={isPending || !passcode.trim()}
						style={{
							padding: "8px 16px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "var(--color-accent-green)",
							border: "none",
							borderRadius: "var(--radius-md)",
							color: "var(--color-bg-base)",
							cursor: isPending ? "wait" : "pointer",
							opacity: isPending || !passcode.trim() ? 0.6 : 1,
							display: "flex",
							alignItems: "center",
							gap: 6,
						}}
					>
						<Lock size={14} />
						{isPending ? "Locking..." : "Lock & Create Link"}
					</button>
				</div>
			</motion.div>
		</div>
	);
}

// ── Share link success panel ──────────────────────────────────────────────────

interface ShareLinkPanelProps {
	shareToken: string;
	onClose: () => void;
}

export function ShareLinkPanel({ shareToken, onClose }: ShareLinkPanelProps) {
	const [copied, setCopied] = useState(false);
	const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}`;

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(shareUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [shareUrl]);

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 50,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--color-overlay-scrim)",
			}}
			onClick={(e) => e.target === e.currentTarget && onClose()}
			onKeyDown={() => {}}
		>
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ type: "spring", stiffness: 500, damping: 30 }}
				style={{
					background: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-default)",
					borderRadius: "var(--radius-lg)",
					padding: 24,
					width: "100%",
					maxWidth: 440,
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 16,
					}}
				>
					<h2
						style={{
							fontFamily: "var(--font-display)",
							fontSize: "var(--text-lg)",
							color: "var(--color-accent-green)",
							margin: 0,
						}}
					>
						Stack locked
					</h2>
					<button
						type="button"
						onClick={onClose}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: "var(--color-text-muted)",
							padding: 4,
						}}
					>
						<X size={18} />
					</button>
				</div>

				<p
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-secondary)",
						marginBottom: 16,
					}}
				>
					Share this link with stakeholders. They'll need the passcode you set to view.
				</p>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 8,
						background: "var(--color-bg-sunken)",
						border: "1px solid var(--color-border-subtle)",
						borderRadius: "var(--radius-md)",
						padding: "8px 12px",
						marginBottom: 16,
					}}
				>
					<span
						style={{
							flex: 1,
							fontFamily: "var(--font-mono)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-primary)",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{shareUrl}
					</span>
					<button
						type="button"
						onClick={handleCopy}
						style={{
							background: "none",
							border: "none",
							cursor: "pointer",
							color: copied ? "var(--color-accent-green)" : "var(--color-text-muted)",
							padding: 4,
							flexShrink: 0,
						}}
						title="Copy link"
					>
						<Copy size={16} />
					</button>
				</div>

				<button
					type="button"
					onClick={onClose}
					style={{
						width: "100%",
						padding: "8px 16px",
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-sm)",
						background: "var(--color-accent-green-muted)",
						border: "1px solid var(--color-accent-green)",
						borderRadius: "var(--radius-md)",
						color: "var(--color-accent-green)",
						cursor: "pointer",
					}}
				>
					Done
				</button>
			</motion.div>
		</div>
	);
}
