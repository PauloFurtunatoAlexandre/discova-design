"use client";

import { NODE_WIDTH } from "@/lib/map/constants";
import type { MapNodeData } from "@/lib/map/types";

interface MapConnectionLineProps {
	sourceNode: MapNodeData;
	targetNode: MapNodeData;
	isActive: boolean;
}

const NODE_HEIGHT = 80;

export function MapConnectionLine({ sourceNode, targetNode, isActive }: MapConnectionLineProps) {
	// Source: right edge center
	const sx = sourceNode.positionX + NODE_WIDTH;
	const sy = sourceNode.positionY + NODE_HEIGHT / 2;

	// Target: left edge center
	const tx = targetNode.positionX;
	const ty = targetNode.positionY + NODE_HEIGHT / 2;

	// Control points: horizontal offset at half the distance
	const dx = Math.abs(tx - sx) / 2;
	const cx1 = sx + dx;
	const cy1 = sy;
	const cx2 = tx - dx;
	const cy2 = ty;

	const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

	const stroke = isActive ? "var(--color-connection-active)" : "var(--color-connection-default)";
	const strokeWidth = isActive ? 2.5 : 2;

	const arrowId = `arrow-${sourceNode.id}-${targetNode.id}`;

	return (
		<g>
			<defs>
				<marker
					id={arrowId}
					markerWidth="8"
					markerHeight="8"
					refX="7"
					refY="4"
					orient="auto"
					markerUnits="userSpaceOnUse"
				>
					<path d="M 0 0 L 8 4 L 0 8 Z" fill={stroke} />
				</marker>
			</defs>
			<path
				d={pathD}
				fill="none"
				stroke={stroke}
				strokeWidth={strokeWidth}
				markerEnd={`url(#${arrowId})`}
				style={{ transition: "stroke 120ms ease, stroke-width 120ms ease" }}
			/>
		</g>
	);
}
