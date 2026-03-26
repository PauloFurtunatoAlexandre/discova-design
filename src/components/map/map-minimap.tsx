"use client";

import { NODE_WIDTH } from "@/lib/map/constants";
import { getContentBounds } from "@/lib/map/layout";
import type { MapNodeData, NodeType } from "@/lib/map/types";
import { NODE_COLORS } from "@/lib/map/types";

interface MapMinimapProps {
	nodes: MapNodeData[];
	pan: { x: number; y: number };
	zoom: number;
	containerWidth: number;
	containerHeight: number;
}

const MINIMAP_WIDTH = 160;
const MINIMAP_HEIGHT = 100;

export function MapMinimap({ nodes, pan, zoom, containerWidth, containerHeight }: MapMinimapProps) {
	if (nodes.length === 0) return null;

	const bounds = getContentBounds(nodes);
	const contentWidth = bounds.width || 1;
	const contentHeight = bounds.height || 1;

	// Scale content to fit in minimap
	const scaleX = MINIMAP_WIDTH / contentWidth;
	const scaleY = MINIMAP_HEIGHT / contentHeight;
	const scale = Math.min(scaleX, scaleY) * 0.85;

	// Viewport rectangle (what the user currently sees)
	const vpLeft = (-pan.x / zoom - bounds.minX) * scale;
	const vpTop = (-pan.y / zoom - bounds.minY) * scale;
	const vpWidth = (containerWidth / zoom) * scale;
	const vpHeight = (containerHeight / zoom) * scale;

	return (
		<div
			className="fixed bottom-6 right-6 z-20 overflow-hidden rounded-lg"
			style={{
				width: MINIMAP_WIDTH,
				height: MINIMAP_HEIGHT,
				backgroundColor: "var(--color-bg-overlay)",
				border: "1px solid var(--color-border-default)",
				boxShadow: "var(--shadow-sm)",
				opacity: 0.85,
			}}
			data-testid="map-minimap"
		>
			{/* Node dots */}
			{nodes.map((node) => {
				const x = (node.positionX - bounds.minX) * scale;
				const y = (node.positionY - bounds.minY) * scale;
				const w = NODE_WIDTH * scale;
				const h = 4;
				const colors = NODE_COLORS[node.type];

				return (
					<div
						key={node.id}
						className="absolute rounded-sm"
						style={{
							left: x,
							top: y,
							width: Math.max(w, 4),
							height: h,
							backgroundColor: colors.accent,
							opacity: 0.7,
						}}
					/>
				);
			})}

			{/* Viewport indicator */}
			<div
				className="absolute rounded-sm"
				style={{
					left: Math.max(0, vpLeft),
					top: Math.max(0, vpTop),
					width: Math.min(vpWidth, MINIMAP_WIDTH),
					height: Math.min(vpHeight, MINIMAP_HEIGHT),
					border: "1.5px solid var(--color-accent-blue)",
					backgroundColor: "rgba(91, 138, 240, 0.08)",
					pointerEvents: "none",
				}}
			/>
		</div>
	);
}
