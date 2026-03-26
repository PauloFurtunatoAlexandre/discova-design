"use client";

import { DOT_GRID_SIZE } from "@/lib/map/constants";
import { getContentBounds } from "@/lib/map/layout";
import type { MapData, MapNodeData } from "@/lib/map/types";
import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapConnectionLine } from "./map-connection-line";
import { MapNode } from "./map-node";
import { MapToolbar } from "./map-toolbar";
import { useCanvas } from "./use-canvas";

interface MapCanvasProps {
	mapData: MapData;
	canEdit: boolean;
	workspaceId: string;
	projectId: string;
}

export function MapCanvas({ mapData, canEdit, workspaceId, projectId }: MapCanvasProps) {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

	const {
		pan,
		zoom,
		isPanning,
		handleWheel,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
		zoomIn,
		zoomOut,
		fitToView,
		resetView,
	} = useCanvas();

	// Build a node lookup for connection rendering
	const nodeMap = new Map<string, MapNodeData>();
	for (const node of mapData.nodes) {
		nodeMap.set(node.id, node);
	}

	// Deselect on Escape
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") setSelectedNodeId(null);
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, []);

	// Click canvas background → deselect
	const handleCanvasClick = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).dataset.canvasBackground !== undefined) {
				setSelectedNodeId(null);
			}
			handleMouseDown(e);
		},
		[handleMouseDown],
	);

	const handleFitToView = useCallback(() => {
		if (!containerRef.current) return;
		const bounds = getContentBounds(mapData.nodes);
		const { clientWidth, clientHeight } = containerRef.current;
		fitToView(bounds, clientWidth, clientHeight);
	}, [mapData.nodes, fitToView]);

	const dotSize = DOT_GRID_SIZE * zoom;

	// Empty state
	if (mapData.nodes.length === 0) {
		return (
			<div
				ref={containerRef}
				className="relative flex h-full w-full items-center justify-center"
				style={{
					backgroundColor: "var(--color-bg-canvas)",
					backgroundImage:
						"radial-gradient(circle, var(--color-canvas-dot) 1.5px, transparent 1.5px)",
					backgroundSize: `${DOT_GRID_SIZE}px ${DOT_GRID_SIZE}px`,
				}}
			>
				<div className="flex flex-col items-center text-center" style={{ maxWidth: 400 }}>
					<div
						className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
						style={{
							background: "color-mix(in srgb, var(--color-accent-coral) 12%, transparent)",
						}}
					>
						<Lightbulb size={22} style={{ color: "var(--color-accent-coral)" }} />
					</div>

					<h2
						style={{
							fontFamily: "var(--font-display)",
							fontSize: "var(--text-xl)",
							fontWeight: 500,
							color: "var(--color-text-primary)",
							marginBottom: "0.5rem",
						}}
					>
						Your opportunity map is empty
					</h2>

					<p
						className="mb-6"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-secondary)",
							lineHeight: 1.6,
						}}
					>
						Insights from the Engine will appear here. Connect them to problems and solutions.
					</p>

					<button
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/engine`)}
						className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							background: "var(--color-accent-blue)",
							color: "#fff",
						}}
					>
						Go to Engine →
					</button>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className="relative h-full w-full overflow-hidden"
			style={{
				backgroundColor: "var(--color-bg-canvas)",
				backgroundImage:
					"radial-gradient(circle, var(--color-canvas-dot) 1.5px, transparent 1.5px)",
				backgroundSize: `${dotSize}px ${dotSize}px`,
				backgroundPosition: `${pan.x % dotSize}px ${pan.y % dotSize}px`,
				cursor: isPanning ? "grabbing" : "default",
			}}
			data-canvas-background
			data-testid="map-canvas"
			onWheel={handleWheel}
			onMouseDown={handleCanvasClick}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onMouseLeave={handleMouseUp}
		>
			{/* Transform layer */}
			<div
				style={{
					transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
					transformOrigin: "0 0",
					position: "relative",
					width: "100%",
					height: "100%",
				}}
			>
				{/* Connection lines (SVG behind nodes) */}
				<svg
					className="pointer-events-none absolute inset-0"
					style={{
						width: "100%",
						height: "100%",
						overflow: "visible",
					}}
					aria-hidden="true"
				>
					<title>Map connections</title>
					{mapData.connections.map((conn) => {
						const sourceNode = nodeMap.get(conn.sourceNodeId);
						const targetNode = nodeMap.get(conn.targetNodeId);
						if (!sourceNode || !targetNode) return null;

						const isActive =
							selectedNodeId === conn.sourceNodeId || selectedNodeId === conn.targetNodeId;

						return (
							<MapConnectionLine
								key={conn.id}
								sourceNode={sourceNode}
								targetNode={targetNode}
								isActive={isActive}
							/>
						);
					})}
				</svg>

				{/* Nodes */}
				{mapData.nodes.map((node) => (
					<MapNode
						key={node.id}
						node={node}
						isSelected={selectedNodeId === node.id}
						onSelect={setSelectedNodeId}
						onDeselect={() => setSelectedNodeId(null)}
						canEdit={canEdit}
					/>
				))}
			</div>

			{/* Toolbar */}
			<MapToolbar
				zoom={zoom}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onFitToView={handleFitToView}
				onResetView={resetView}
			/>
		</div>
	);
}
