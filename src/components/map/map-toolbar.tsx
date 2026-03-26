"use client";

import { Maximize2, Minus, Plus, RotateCcw } from "lucide-react";

interface MapToolbarProps {
	zoom: number;
	onZoomIn: () => void;
	onZoomOut: () => void;
	onFitToView: () => void;
	onResetView: () => void;
}

function ToolbarButton({
	label,
	onClick,
	children,
}: {
	label: string;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className="group flex items-center justify-center rounded-[--radius-sm] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
			style={{
				width: 32,
				height: 32,
				color: "var(--color-text-muted)",
				backgroundColor: "transparent",
				border: "none",
				cursor: "pointer",
			}}
			onMouseEnter={(e) => {
				(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-primary)";
				(e.currentTarget as HTMLButtonElement).style.backgroundColor = "var(--color-bg-raised)";
			}}
			onMouseLeave={(e) => {
				(e.currentTarget as HTMLButtonElement).style.color = "var(--color-text-muted)";
				(e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
			}}
		>
			{children}
		</button>
	);
}

export function MapToolbar({
	zoom,
	onZoomIn,
	onZoomOut,
	onFitToView,
	onResetView,
}: MapToolbarProps) {
	return (
		<div
			className="fixed bottom-6 left-[calc(var(--sidebar-width)+1.5rem)] z-30 flex flex-col items-center gap-0.5"
			style={{
				backgroundColor: "var(--color-bg-overlay)",
				border: "1px solid var(--color-border-default)",
				boxShadow: "var(--shadow-sm)",
				borderRadius: "var(--radius-lg)",
				padding: 8,
			}}
		>
			<ToolbarButton label="Zoom in" onClick={onZoomIn}>
				<Plus size={16} />
			</ToolbarButton>
			<ToolbarButton label="Zoom out" onClick={onZoomOut}>
				<Minus size={16} />
			</ToolbarButton>

			{/* Separator */}
			<div
				className="my-1 w-5"
				style={{
					height: 1,
					backgroundColor: "var(--color-border-subtle)",
				}}
			/>

			<ToolbarButton label="Fit to view" onClick={onFitToView}>
				<Maximize2 size={14} />
			</ToolbarButton>
			<ToolbarButton label="Reset view" onClick={onResetView}>
				<RotateCcw size={14} />
			</ToolbarButton>

			{/* Zoom percentage */}
			<span
				className="mt-1"
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "var(--text-xs)",
					color: "var(--color-text-muted)",
					textAlign: "center",
					lineHeight: 1,
				}}
			>
				{Math.round(zoom * 100)}%
			</span>
		</div>
	);
}
