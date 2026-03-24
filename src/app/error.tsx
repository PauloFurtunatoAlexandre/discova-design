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
		<div style={{ padding: "48px", textAlign: "center", fontFamily: "system-ui" }}>
			<h1 style={{ fontSize: "24px", marginBottom: "16px" }}>Something went wrong</h1>
			<p style={{ color: "#666", marginBottom: "24px" }}>
				We've been notified and are looking into it.
			</p>
			<button
				onClick={reset}
				type="button"
				style={{
					padding: "12px 24px",
					background: "#E8C547",
					color: "#0C0C0F",
					border: "none",
					borderRadius: "8px",
					cursor: "pointer",
					fontSize: "14px",
					fontWeight: 600,
				}}
			>
				Try again
			</button>
		</div>
	);
}
