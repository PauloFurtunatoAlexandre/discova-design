export default function NotFound() {
	return (
		<div
			className="flex min-h-[400px] flex-col items-center justify-center gap-4 px-6"
			style={{ fontFamily: "var(--font-body)" }}
		>
			<h1
				className="text-6xl font-light"
				style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
			>
				404
			</h1>
			<p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
				This page doesn't exist.
			</p>
			<a
				href="/"
				className="rounded-lg px-5 py-2.5 text-sm font-semibold no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2"
				style={{
					background: "var(--color-accent-gold)",
					color: "var(--color-bg-base)",
					fontFamily: "var(--font-body)",
					outlineColor: "var(--color-border-focus)",
				}}
			>
				Go home
			</a>
		</div>
	);
}
