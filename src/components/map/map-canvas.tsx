"use client";

import { createConnectionAction } from "@/actions/map";
import { DOT_GRID_SIZE } from "@/lib/map/constants";
import { getContentBounds } from "@/lib/map/layout";
import type { MapData, MapNodeData } from "@/lib/map/types";
import type { UnplacedInsight } from "@/lib/queries/map";
import { Lightbulb } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { CreateNodeSlideover } from "./create-node-slideover";
import { MapConnectionLine } from "./map-connection-line";
import { MapFab } from "./map-fab";
import { MapMinimap } from "./map-minimap";
import { MapNode } from "./map-node";
import { MapSearchOverlay } from "./map-search-overlay";
import { MapToolbar } from "./map-toolbar";
import { NodeContextMenu } from "./node-context-menu";
import { UnplacedInsightsPanel } from "./unplaced-insights-panel";
import { useCanvas } from "./use-canvas";
import { useDragConnect } from "./use-drag-connect";
import { useNodeDrag } from "./use-node-drag";

interface MapCanvasProps {
	mapData: MapData;
	canEdit: boolean;
	workspaceId: string;
	projectId: string;
	unplacedInsights?: UnplacedInsight[];
}

export function MapCanvas({
	mapData,
	canEdit,
	workspaceId,
	projectId,
	unplacedInsights = [],
}: MapCanvasProps) {
	const router = useRouter();
	const containerRef = useRef<HTMLDivElement>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [slideoverType, setSlideoverType] = useState<"problem" | "solution" | null>(null);
	const [showInsightsPanel, setShowInsightsPanel] = useState(false);
	const [contextMenuNodeId, setContextMenuNodeId] = useState<string | null>(null);
	const [showSearch, setShowSearch] = useState(false);
	const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
	const [, startTransition] = useTransition();

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

	// ── Connection drag ────────────────────────────────────────────────
	const handleConnect = useCallback(
		(sourceNodeId: string, targetNodeId: string) => {
			startTransition(async () => {
				await createConnectionAction({
					workspaceId,
					projectId,
					sourceNodeId,
					targetNodeId,
				});
			});
		},
		[workspaceId, projectId],
	);

	const { dragState, handleDragMouseDown, handleDragMouseMove, handleDragMouseUp, cancelDrag } =
		useDragConnect(mapData.nodes, pan, zoom, handleConnect);

	// ── Node drag ──────────────────────────────────────────────────────
	const {
		nodeDragState,
		dragPositions,
		startNodeDrag,
		handleNodeDragMove,
		endNodeDrag,
		cancelNodeDrag,
	} = useNodeDrag(zoom, pan, workspaceId, projectId);

	// Build a node lookup for connection rendering
	const nodeMap = new Map<string, MapNodeData>();
	for (const node of mapData.nodes) {
		nodeMap.set(node.id, node);
	}

	// ── Keyboard shortcuts ─────────────────────────────────────────────
	useEffect(() => {
		function handleKey(e: KeyboardEvent) {
			// Escape: deselect / close overlays
			if (e.key === "Escape") {
				setSelectedNodeId(null);
				setContextMenuNodeId(null);
				setShowSearch(false);
				cancelDrag();
				cancelNodeDrag();
			}

			// ⌘K / Ctrl+K: search
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				setShowSearch((prev) => !prev);
			}
		}
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [cancelDrag, cancelNodeDrag]);

	// ── Canvas mouse handlers ──────────────────────────────────────────
	const handleCanvasClick = useCallback(
		(e: React.MouseEvent) => {
			if ((e.target as HTMLElement).dataset.canvasBackground !== undefined) {
				setSelectedNodeId(null);
				setContextMenuNodeId(null);
			}
			handleMouseDown(e);
		},
		[handleMouseDown],
	);

	const handleCanvasMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (nodeDragState.isDragging) {
				handleNodeDragMove(e);
			} else if (dragState.isDragging) {
				handleDragMouseMove(e);
			} else {
				handleMouseMove(e);
			}
		},
		[
			nodeDragState.isDragging,
			dragState.isDragging,
			handleNodeDragMove,
			handleDragMouseMove,
			handleMouseMove,
		],
	);

	const handleCanvasMouseUp = useCallback(
		(e: React.MouseEvent) => {
			if (nodeDragState.isDragging) {
				endNodeDrag();
			} else if (dragState.isDragging) {
				handleDragMouseUp(e);
			} else {
				handleMouseUp();
			}
		},
		[nodeDragState.isDragging, dragState.isDragging, endNodeDrag, handleDragMouseUp, handleMouseUp],
	);

	const handleFitToView = useCallback(() => {
		if (!containerRef.current) return;
		const bounds = getContentBounds(mapData.nodes);
		const { clientWidth, clientHeight } = containerRef.current;
		fitToView(bounds, clientWidth, clientHeight);
	}, [mapData.nodes, fitToView]);

	// ── Context menu ──────────────────────────────────────────────────
	const handleNodeContextMenu = useCallback(
		(e: React.MouseEvent, nodeId: string) => {
			if (!canEdit) return;
			e.preventDefault();
			setContextMenuNodeId(nodeId);
			setSelectedNodeId(nodeId);
		},
		[canEdit],
	);

	// ── Collapse toggle ───────────────────────────────────────────────
	const toggleCollapse = useCallback((nodeId: string) => {
		setCollapsedNodes((prev) => {
			const next = new Set(prev);
			if (next.has(nodeId)) {
				next.delete(nodeId);
			} else {
				next.add(nodeId);
			}
			return next;
		});
	}, []);

	// ── Search → select + center ──────────────────────────────────────
	const handleSearchSelect = useCallback(
		(nodeId: string) => {
			setSelectedNodeId(nodeId);
			const node = nodeMap.get(nodeId);
			if (node && containerRef.current) {
				const { clientWidth, clientHeight } = containerRef.current;
				// TODO: pan to center the node in view (nice-to-have)
			}
		},
		[nodeMap],
	);

	const dotSize = DOT_GRID_SIZE * zoom;
	const contextMenuNode = contextMenuNodeId ? nodeMap.get(contextMenuNodeId) : null;
	const containerWidth = containerRef.current?.clientWidth ?? 0;
	const containerHeight = containerRef.current?.clientHeight ?? 0;

	// ── Cursor logic ──────────────────────────────────────────────────
	let cursor = "default";
	if (nodeDragState.isDragging) cursor = "grabbing";
	else if (dragState.isDragging) cursor = "crosshair";
	else if (isPanning) cursor = "grabbing";

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
							color: "var(--color-text-inverse)",
						}}
					>
						Go to Engine →
					</button>
				</div>

				{canEdit && (
					<>
						<MapFab
							onCreateProblem={() => setSlideoverType("problem")}
							onCreateSolution={() => setSlideoverType("solution")}
						/>
						<CreateNodeSlideover
							isOpen={slideoverType !== null}
							onClose={() => setSlideoverType(null)}
							nodeType={slideoverType ?? "problem"}
							workspaceId={workspaceId}
							projectId={projectId}
						/>
					</>
				)}

				{canEdit && unplacedInsights.length > 0 && (
					<UnplacedInsightsPanel
						insights={unplacedInsights}
						isOpen={showInsightsPanel}
						onToggle={() => setShowInsightsPanel((p) => !p)}
						workspaceId={workspaceId}
						projectId={projectId}
					/>
				)}
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
				cursor,
			}}
			data-canvas-background
			data-testid="map-canvas"
			onWheel={handleWheel}
			onMouseDown={(e) => {
				handleDragMouseDown(e);
				if (!dragState.isDragging && !nodeDragState.isDragging) handleCanvasClick(e);
			}}
			onMouseMove={handleCanvasMouseMove}
			onMouseUp={handleCanvasMouseUp}
			onMouseLeave={() => {
				handleMouseUp();
				cancelDrag();
				endNodeDrag();
			}}
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

						// Apply drag position overrides for connection rendering
						const srcDrag = dragPositions[conn.sourceNodeId];
						const tgtDrag = dragPositions[conn.targetNodeId];
						const adjustedSource = srcDrag
							? { ...sourceNode, positionX: srcDrag.x, positionY: srcDrag.y }
							: sourceNode;
						const adjustedTarget = tgtDrag
							? { ...targetNode, positionX: tgtDrag.x, positionY: tgtDrag.y }
							: targetNode;

						const isActive =
							selectedNodeId === conn.sourceNodeId || selectedNodeId === conn.targetNodeId;

						return (
							<MapConnectionLine
								key={conn.id}
								sourceNode={adjustedSource}
								targetNode={adjustedTarget}
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
						onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
						onDragStart={startNodeDrag}
						dragPosition={dragPositions[node.id]}
						isCollapsed={collapsedNodes.has(node.id)}
					/>
				))}
			</div>

			{/* Drag-to-connect preview line */}
			{dragState.isDragging && (
				<svg
					className="pointer-events-none fixed inset-0 z-50"
					style={{ width: "100%", height: "100%", overflow: "visible" }}
					aria-hidden="true"
				>
					<title>Connection preview</title>
					<line
						x1={dragState.sourceX}
						y1={dragState.sourceY}
						x2={dragState.cursorX}
						y2={dragState.cursorY}
						stroke="var(--color-accent-gold)"
						strokeWidth={2}
						strokeDasharray="6 4"
						opacity={0.7}
					/>
				</svg>
			)}

			{/* Context menu */}
			{contextMenuNode && canEdit && (
				<div
					className="absolute z-30"
					style={{
						left: contextMenuNode.positionX * zoom + pan.x,
						top: contextMenuNode.positionY * zoom + pan.y - 48,
					}}
				>
					<NodeContextMenu
						node={contextMenuNode}
						workspaceId={workspaceId}
						projectId={projectId}
						onClose={() => {
							setContextMenuNodeId(null);
							setSelectedNodeId(null);
						}}
					/>
				</div>
			)}

			{/* Toolbar */}
			<MapToolbar
				zoom={zoom}
				onZoomIn={zoomIn}
				onZoomOut={zoomOut}
				onFitToView={handleFitToView}
				onResetView={resetView}
			/>

			{/* Mini-map */}
			<MapMinimap
				nodes={mapData.nodes}
				pan={pan}
				zoom={zoom}
				containerWidth={containerWidth}
				containerHeight={containerHeight}
			/>

			{/* Unplaced insights panel */}
			{canEdit && unplacedInsights.length > 0 && (
				<UnplacedInsightsPanel
					insights={unplacedInsights}
					isOpen={showInsightsPanel}
					onToggle={() => setShowInsightsPanel((p) => !p)}
					workspaceId={workspaceId}
					projectId={projectId}
				/>
			)}

			{/* FAB for creating nodes */}
			{canEdit && (
				<>
					<MapFab
						onCreateProblem={() => setSlideoverType("problem")}
						onCreateSolution={() => setSlideoverType("solution")}
					/>
					<CreateNodeSlideover
						isOpen={slideoverType !== null}
						onClose={() => setSlideoverType(null)}
						nodeType={slideoverType ?? "problem"}
						workspaceId={workspaceId}
						projectId={projectId}
					/>
				</>
			)}

			{/* Search overlay (⌘K) */}
			{showSearch && (
				<MapSearchOverlay
					nodes={mapData.nodes}
					onSelectNode={handleSearchSelect}
					onClose={() => setShowSearch(false)}
				/>
			)}
		</div>
	);
}
