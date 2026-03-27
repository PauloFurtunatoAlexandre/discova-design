"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

interface PhaseErrorProps {
	error: Error & { digest?: string };
	reset: () => void;
	phase: "vault" | "engine" | "map" | "stack" | "team";
}

const PHASE_LABELS: Record<PhaseErrorProps["phase"], { name: string; color: string }> = {
	vault: { name: "Vault", color: "var(--color-accent-gold)" },
	engine: { name: "Engine", color: "var(--color-accent-blue)" },
	map: { name: "Map", color: "var(--color-accent-coral)" },
	stack: { name: "Stack", color: "var(--color-accent-green)" },
	team: { name: "Team", color: "var(--color-accent-purple)" },
};

export function PhaseError({ error, reset, phase }: PhaseErrorProps) {
	const { name, color } = PHASE_LABELS[phase];

	useEffect(() => {
		Sentry.captureException(error, { tags: { phase } });
	}, [error, phase]);

	return (
		<div
			className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 px-6"
			style={{ fontFamily: "var(--font-body)" }}
		>
			<div
				className="flex items-center justify-center rounded-full"
				style={{
					width: 56,
					height: 56,
					background: `color-mix(in srgb, ${color} 12%, transparent)`,
				}}
			>
				<AlertTriangle size={28} style={{ color }} />
			</div>

			<h2
				className="text-lg font-semibold"
				style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
			>
				{name} failed to load
			</h2>

			<p
				className="max-w-md text-center text-sm"
				style={{ color: "var(--color-text-muted)" }}
			>
				Something went wrong while loading the {name.toLowerCase()} phase. Our team has been
				notified. You can try again or navigate to another section.
			</p>

			{error.digest && (
				<p
					className="text-xs"
					style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
				>
					Error ID: {error.digest}
				</p>
			)}

			<button
				type="button"
				onClick={reset}
				className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
				style={{
					background: color,
					color: "var(--color-text-inverse)",
					fontFamily: "var(--font-body)",
					outlineColor: "var(--color-border-focus)",
				}}
			>
				Try again
			</button>
		</div>
	);
}
