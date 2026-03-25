"use client";

import type { LinkedInsight } from "@/lib/queries/vault";
import { useRouter } from "next/navigation";

interface LinkedInsightsListProps {
	insights: LinkedInsight[];
	workspaceId: string;
	projectId: string;
}

function ConfidenceRing({ score }: { score: number }) {
	const size = 24;
	const strokeWidth = 2.5;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${size} ${size}`}
			className="shrink-0"
			role="img"
			aria-label={`${score}% confidence`}
		>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--color-border-subtle)"
				strokeWidth={strokeWidth}
			/>
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="var(--color-accent-blue)"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
			<text
				x={size / 2}
				y={size / 2}
				textAnchor="middle"
				dominantBaseline="central"
				fill="var(--color-text-muted)"
				style={{ fontSize: "6px", fontFamily: "var(--font-mono)" }}
			>
				{score}
			</text>
		</svg>
	);
}

export function LinkedInsightsList({ insights, workspaceId, projectId }: LinkedInsightsListProps) {
	const router = useRouter();

	const labelStyle: React.CSSProperties = {
		fontFamily: "var(--font-mono)",
		fontSize: "0.7rem",
		color: "var(--color-text-muted)",
		textTransform: "uppercase" as const,
		letterSpacing: "0.08em",
	};

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center gap-2">
				<p style={labelStyle}>Insights</p>
				{insights.length > 0 && (
					<span
						className="rounded-full px-1.5 py-0.5"
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "0.65rem",
							color: "var(--color-accent-blue)",
							background: "var(--color-accent-blue-muted)",
							border: "1px solid var(--color-accent-blue-border)",
						}}
					>
						{insights.length}
					</span>
				)}
			</div>

			{insights.length === 0 ? (
				<p
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.75rem",
						color: "var(--color-text-muted)",
						fontStyle: "italic",
						lineHeight: 1.5,
					}}
				>
					No insights linked yet. Analyse this note to generate insights.
				</p>
			) : (
				<ul className="flex flex-col gap-2">
					{insights.map((insight) => (
						<li key={insight.id}>
							<button
								type="button"
								onClick={() => router.push(`/${workspaceId}/${projectId}/engine/${insight.id}`)}
								className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors duration-100 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
								style={{ border: "1px solid var(--color-border-subtle)" }}
							>
								<ConfidenceRing score={insight.confidenceScore} />
								<p
									style={{
										fontFamily: "var(--font-body)",
										fontSize: "0.8rem",
										color: "var(--color-text-secondary)",
										lineHeight: 1.4,
									}}
								>
									{insight.statement.length > 80
										? `${insight.statement.slice(0, 80)}...`
										: insight.statement}
								</p>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
