"use client";

import { HANDLE_SIZE, NODE_WIDTH } from "@/lib/map/constants";
import type { BaseState, MapNodeData, NodeType, OverlayState } from "@/lib/map/types";
import { NODE_COLORS } from "@/lib/map/types";
import { AlertTriangle } from "lucide-react";
import { type CSSProperties, useState } from "react";

interface MapNodeProps {
	node: MapNodeData;
	isSelected: boolean;
	onSelect: (nodeId: string) => void;
	onDeselect: () => void;
	canEdit: boolean;
	onContextMenu?: (e: React.MouseEvent) => void;
}

const ACCENT_RGB: Record<NodeType, string> = {
	insight: "91, 138, 240",
	problem: "232, 125, 91",
	solution: "126, 191, 142",
};

const TYPE_LABELS: Record<NodeType, string> = {
	insight: "Insight",
	problem: "Problem",
	solution: "Solution",
};

function getNodeStyles(type: NodeType, baseState: BaseState, overlay: OverlayState): CSSProperties {
	const colors = NODE_COLORS[type];
	const rgb = ACCENT_RGB[type];

	const styles: CSSProperties = {
		position: "absolute",
		width: `${NODE_WIDTH}px`,
		maxWidth: "320px",
		minHeight: "64px",
		borderRadius: "var(--radius-lg)",
		padding: "12px 16px",
		cursor: "pointer",
		transition: "var(--node-hover-transition)",
		transformOrigin: "center center",
		borderWidth: "1.5px",
		borderStyle: "solid",
		borderColor: colors.accent,
		backgroundColor: colors.accentMuted,
		opacity: 1,
		boxShadow: "var(--shadow-card)",
	};

	switch (baseState) {
		case "connected":
			// defaults above
			break;

		case "unconnected":
			styles.borderStyle = "dashed";
			styles.borderColor = `rgba(${rgb}, 0.4)`;
			styles.backgroundColor = "transparent";
			styles.opacity = 0.7;
			styles.boxShadow = "none";
			break;

		case "orphan":
			styles.borderStyle = "dashed";
			styles.borderColor = "var(--node-orphan-border)";
			styles.backgroundColor = "var(--node-orphan-bg)";
			styles.opacity = 0.85;
			break;
	}

	if (overlay === "selected") {
		styles.borderWidth = "2px";
		styles.borderStyle = "solid";
		styles.borderColor = colors.accent;
		styles.boxShadow = `0 0 0 4px rgba(${rgb}, var(--node-selected-glow-opacity)), var(--shadow-md)`;
		styles.opacity = 1;
		styles.zIndex = 10;
	}

	if (overlay === "hover") {
		styles.transform = "scale(var(--node-hover-scale))";
		styles.opacity = 1;
	}

	return styles;
}

export function MapNode({
	node,
	isSelected,
	onSelect,
	onDeselect,
	canEdit,
	onContextMenu,
}: MapNodeProps) {
	const [isHovered, setIsHovered] = useState(false);

	const overlay: OverlayState = isSelected ? "selected" : isHovered ? "hover" : "none";

	const styles = getNodeStyles(node.type, node.baseState, overlay);
	const colors = NODE_COLORS[node.type];

	function handleClick(e: React.MouseEvent) {
		e.stopPropagation();
		if (isSelected) {
			onDeselect();
		} else {
			onSelect(node.id);
		}
	}

	return (
		<button
			type="button"
			data-testid="map-node"
			data-node-id={node.id}
			data-node-type={node.type}
			data-base-state={node.baseState}
			aria-label={`${TYPE_LABELS[node.type]}: ${node.label}`}
			aria-selected={isSelected}
			style={{
				...styles,
				left: node.positionX,
				top: node.positionY,
				textAlign: "left",
			}}
			onClick={handleClick}
			onContextMenu={onContextMenu}
			onKeyDown={(e) => {
				if (e.key === "Escape") onDeselect();
			}}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Type indicator dot + label */}
			<div className="flex items-start gap-2">
				<span
					className="mt-1.5 shrink-0 rounded-full"
					style={{
						width: 8,
						height: 8,
						backgroundColor: colors.accent,
					}}
				/>
				<span
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-sm)",
						fontWeight: 500,
						color: "var(--color-text-primary)",
						lineHeight: 1.4,
						display: "-webkit-box",
						WebkitLineClamp: 3,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{node.label}
				</span>
			</div>

			{/* Description preview */}
			{node.description && (
				<p
					className="mt-1 pl-4"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "var(--text-xs)",
						color: "var(--color-text-secondary)",
						lineHeight: 1.5,
						display: "-webkit-box",
						WebkitLineClamp: 2,
						WebkitBoxOrient: "vertical",
						overflow: "hidden",
					}}
				>
					{node.description}
				</p>
			)}

			{/* Unlinked micro-label */}
			{node.baseState === "unconnected" && (
				<span
					className="mt-2 block"
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "10px",
						color: colors.accent,
						opacity: 0.6,
					}}
				>
					Unlinked
				</span>
			)}

			{/* Orphan warning icon */}
			{node.baseState === "orphan" && (
				<div className="group absolute" style={{ top: 8, right: 8 }}>
					<AlertTriangle size={14} style={{ color: "var(--node-orphan-icon)" }} />
					<div
						className="pointer-events-none absolute right-0 top-6 z-20 hidden rounded-md px-3 py-2 group-hover:block"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-xs)",
							color: "var(--color-text-primary)",
							backgroundColor: "var(--color-bg-overlay)",
							border: "1px solid var(--color-border-default)",
							boxShadow: "var(--shadow-md)",
							maxWidth: 240,
							lineHeight: 1.5,
							whiteSpace: "normal",
						}}
					>
						This solution isn&apos;t linked to a problem. Solutions without evidence can&apos;t be
						scored in the Stack.
					</div>
				</div>
			)}

			{/* Connection handles (selected + canEdit only) */}
			{isSelected && canEdit && (
				<>
					{/* Top handle */}
					<span
						className="absolute"
						data-handle="top"
						style={{
							left: "50%",
							top: -HANDLE_SIZE / 2,
							width: HANDLE_SIZE,
							height: HANDLE_SIZE,
							borderRadius: "50%",
							backgroundColor: colors.accent,
							border: "2px solid var(--color-bg-surface)",
							transform: "translateX(-50%)",
							cursor: "crosshair",
						}}
					/>
					{/* Right handle */}
					<span
						className="absolute"
						data-handle="right"
						style={{
							right: -HANDLE_SIZE / 2,
							top: "50%",
							width: HANDLE_SIZE,
							height: HANDLE_SIZE,
							borderRadius: "50%",
							backgroundColor: colors.accent,
							border: "2px solid var(--color-bg-surface)",
							transform: "translateY(-50%)",
							cursor: "crosshair",
						}}
					/>
					{/* Bottom handle */}
					<span
						className="absolute"
						data-handle="bottom"
						style={{
							left: "50%",
							bottom: -HANDLE_SIZE / 2,
							width: HANDLE_SIZE,
							height: HANDLE_SIZE,
							borderRadius: "50%",
							backgroundColor: colors.accent,
							border: "2px solid var(--color-bg-surface)",
							transform: "translateX(-50%)",
							cursor: "crosshair",
						}}
					/>
				</>
			)}
		</button>
	);
}
