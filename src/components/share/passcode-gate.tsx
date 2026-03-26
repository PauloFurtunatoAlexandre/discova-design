"use client";

import { verifySharePasscode } from "@/actions/stack";
import type { StackItemWithNode } from "@/lib/queries/stack";
import { motion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

interface PasscodeGateProps {
	token: string;
	onAuthenticated: (data: StackItemWithNode[], viewMode: "stakeholder" | "presentation") => void;
}

export function PasscodeGate({ token, onAuthenticated }: PasscodeGateProps) {
	const [passcode, setPasscode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const handleSubmit = useCallback(() => {
		if (!passcode.trim()) {
			setError("Please enter the passcode");
			return;
		}
		setError(null);
		startTransition(async () => {
			const result = await verifySharePasscode(token, passcode.trim());
			if (!result.valid) {
				setError("Invalid passcode. Please try again.");
				return;
			}
			onAuthenticated(
				result.snapshotData as StackItemWithNode[],
				result.viewMode as "stakeholder" | "presentation",
			);
		});
	}, [token, passcode, onAuthenticated]);

	return (
		<div
			style={{
				minHeight: "100vh",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "var(--color-bg-base)",
				padding: 24,
			}}
		>
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 400, damping: 30 }}
				style={{
					background: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-default)",
					borderRadius: "var(--radius-lg)",
					padding: 32,
					width: "100%",
					maxWidth: 400,
					textAlign: "center",
				}}
			>
				<div
					style={{
						width: 56,
						height: 56,
						borderRadius: "var(--radius-lg)",
						background: "var(--color-accent-green-muted)",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						margin: "0 auto 20px",
					}}
				>
					<ShieldCheck size={28} style={{ color: "var(--color-accent-green)" }} />
				</div>

				<h1
					style={{
						fontFamily: "var(--font-display)",
						fontSize: "var(--text-xl)",
						color: "var(--color-text-primary)",
						margin: "0 0 8px",
					}}
				>
					Priority Stack
				</h1>
				<p
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-sm)",
						color: "var(--color-text-secondary)",
						margin: "0 0 24px",
					}}
				>
					Enter the passcode to view this shared stack.
				</p>

				<div style={{ marginBottom: 16 }}>
					<input
						ref={inputRef}
						type="password"
						value={passcode}
						onChange={(e) => setPasscode(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
						placeholder="Passcode"
						style={{
							width: "100%",
							padding: "10px 14px",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							background: "var(--color-bg-sunken)",
							border: `1px solid ${error ? "var(--color-status-error)" : "var(--color-border-subtle)"}`,
							borderRadius: "var(--radius-md)",
							color: "var(--color-text-primary)",
							outline: "none",
							textAlign: "center",
							letterSpacing: "0.1em",
						}}
					/>
				</div>

				{error && (
					<p
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-status-error)",
							margin: "0 0 12px",
						}}
					>
						{error}
					</p>
				)}

				<button
					type="button"
					onClick={handleSubmit}
					disabled={isPending || !passcode.trim()}
					style={{
						width: "100%",
						padding: "10px 16px",
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
						justifyContent: "center",
						gap: 6,
					}}
				>
					<Lock size={14} />
					{isPending ? "Verifying..." : "View Stack"}
				</button>

				<p
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "10px",
						color: "var(--color-text-muted)",
						marginTop: 20,
						textTransform: "uppercase",
						letterSpacing: "0.05em",
					}}
				>
					Powered by Discova
				</p>
			</motion.div>
		</div>
	);
}
