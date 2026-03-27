"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		Sentry.captureException(error);
	}, [error]);

	return (
		<div
			className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6"
			style={{ fontFamily: "var(--font-body)" }}
		>
			<h1
				className="text-2xl font-semibold"
				style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
			>
				Something went wrong
			</h1>
			<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
				We've been notified and are looking into it.
			</p>
			<button
				onClick={reset}
				type="button"
				className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
				style={{
					background: "var(--color-accent-gold)",
					color: "var(--color-bg-base)",
					fontFamily: "var(--font-body)",
					outlineColor: "var(--color-border-focus)",
				}}
			>
				Try again
			</button>
		</div>
	);
}
