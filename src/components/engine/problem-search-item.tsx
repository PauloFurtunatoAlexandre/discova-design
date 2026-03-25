"use client";

interface ProblemSearchItemProps {
	label: string;
	description?: string | null | undefined;
	connectedInsightCount: number;
	onClick: () => void;
}

export function ProblemSearchItem({
	label,
	description,
	connectedInsightCount,
	onClick,
}: ProblemSearchItemProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			className="w-full rounded-md px-3 py-2 text-left transition-colors duration-100 hover:bg-[--color-bg-raised] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
		>
			<div className="flex items-center justify-between gap-2">
				<span
					className="truncate"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.875rem",
						color: "var(--color-text-primary)",
					}}
				>
					{label}
				</span>
				{connectedInsightCount > 0 && (
					<span
						className="shrink-0 rounded-full px-1.5 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							background: "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)",
							color: "var(--color-accent-blue)",
						}}
					>
						{connectedInsightCount} insight{connectedInsightCount !== 1 ? "s" : ""}
					</span>
				)}
			</div>
			{description && (
				<p
					className="mt-0.5 truncate"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
					}}
				>
					{description.length > 60 ? `${description.slice(0, 60)}…` : description}
				</p>
			)}
		</button>
	);
}
