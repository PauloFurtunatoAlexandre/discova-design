/**
 * Skeleton placeholder for loading states.
 * Uses CSS animation via Tailwind's animate-pulse.
 */
export function Skeleton({
	className = "",
	style,
}: { className?: string; style?: React.CSSProperties }) {
	return (
		<div
			className={`animate-pulse rounded-md ${className}`}
			style={{
				background: "var(--color-bg-elevated)",
				...style,
			}}
		/>
	);
}
