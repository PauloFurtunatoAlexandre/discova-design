"use client";

const TIER_CONFIG = {
	now: {
		label: "Now",
		bg: "var(--color-status-success-muted)",
		color: "var(--color-status-success)",
		border: "var(--color-status-success)",
	},
	next: {
		label: "Next",
		bg: "var(--color-accent-blue-muted)",
		color: "var(--color-accent-blue)",
		border: "var(--color-accent-blue)",
	},
	later: {
		label: "Later",
		bg: "var(--color-accent-gold-muted)",
		color: "var(--color-accent-gold)",
		border: "var(--color-accent-gold)",
	},
	someday: {
		label: "Someday",
		bg: "var(--color-bg-elevated)",
		color: "var(--color-text-muted)",
		border: "var(--color-border-subtle)",
	},
} as const;

interface TierBadgeProps {
	tier: "now" | "next" | "later" | "someday" | null;
	onChangeTier?: ((tier: "now" | "next" | "later" | "someday" | null) => void) | undefined;
	disabled?: boolean | undefined;
}

export function TierBadge({ tier, onChangeTier, disabled }: TierBadgeProps) {
	if (!onChangeTier || disabled) {
		if (!tier) {
			return (
				<span
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-muted)",
						padding: "2px 8px",
					}}
				>
					—
				</span>
			);
		}
		const config = TIER_CONFIG[tier];
		return (
			<span
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "var(--text-xs)",
					textTransform: "uppercase",
					letterSpacing: "0.05em",
					padding: "2px 8px",
					borderRadius: "var(--radius-sm)",
					background: config.bg,
					color: config.color,
					border: `1px solid ${config.border}`,
				}}
			>
				{config.label}
			</span>
		);
	}

	return (
		<select
			value={tier ?? ""}
			onChange={(e) => {
				const v = e.target.value;
				onChangeTier(v === "" ? null : (v as "now" | "next" | "later" | "someday"));
			}}
			style={{
				fontFamily: "var(--font-mono)",
				fontSize: "var(--text-xs)",
				textTransform: "uppercase",
				letterSpacing: "0.05em",
				padding: "2px 8px",
				borderRadius: "var(--radius-sm)",
				background: tier ? TIER_CONFIG[tier].bg : "transparent",
				color: tier ? TIER_CONFIG[tier].color : "var(--color-text-muted)",
				border: `1px solid ${tier ? TIER_CONFIG[tier].border : "var(--color-border-subtle)"}`,
				cursor: "pointer",
				appearance: "none",
			}}
		>
			<option value="">—</option>
			<option value="now">Now</option>
			<option value="next">Next</option>
			<option value="later">Later</option>
			<option value="someday">Someday</option>
		</select>
	);
}
