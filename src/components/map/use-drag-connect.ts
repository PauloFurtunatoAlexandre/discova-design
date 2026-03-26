"use client";

import { NODE_WIDTH } from "@/lib/map/constants";
import type { MapNodeData } from "@/lib/map/types";
import { useCallback, useRef, useState } from "react";

interface DragConnectState {
	isDragging: boolean;
	sourceNodeId: string | null;
	/** Screen-space cursor position during drag */
	cursorX: number;
	cursorY: number;
	/** Source node center for line start */
	sourceX: number;
	sourceY: number;
}

const INITIAL: DragConnectState = {
	isDragging: false,
	sourceNodeId: null,
	cursorX: 0,
	cursorY: 0,
	sourceX: 0,
	sourceY: 0,
};

/**
 * Hook for drag-to-connect interaction on map node handles.
 *
 * When the user mousedowns on a connection handle (data-handle attribute),
 * starts tracking cursor position to draw a preview line. On mouseup over
 * another node, fires the onConnect callback.
 */
export function useDragConnect(
	nodes: MapNodeData[],
	pan: { x: number; y: number },
	zoom: number,
	onConnect: (sourceNodeId: string, targetNodeId: string) => void,
) {
	const [state, setState] = useState<DragConnectState>(INITIAL);
	const nodesRef = useRef(nodes);
	nodesRef.current = nodes;

	const handleMouseDown = useCallback(
		(e: React.MouseEvent) => {
			const target = e.target as HTMLElement;
			const handle = target.closest("[data-handle]") as HTMLElement | null;
			if (!handle) return;

			const nodeEl = handle.closest("[data-node-id]") as HTMLElement | null;
			if (!nodeEl) return;

			const nodeId = nodeEl.dataset.nodeId;
			if (!nodeId) return;

			e.stopPropagation();
			e.preventDefault();

			const node = nodesRef.current.find((n) => n.id === nodeId);
			if (!node) return;

			// Calculate source center in screen space
			const sourceX = node.positionX * zoom + pan.x + (NODE_WIDTH * zoom) / 2;
			const sourceY = node.positionY * zoom + pan.y + 40 * zoom;

			setState({
				isDragging: true,
				sourceNodeId: nodeId,
				cursorX: e.clientX,
				cursorY: e.clientY,
				sourceX,
				sourceY,
			});
		},
		[pan, zoom],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			if (!state.isDragging) return;
			setState((prev) => ({
				...prev,
				cursorX: e.clientX,
				cursorY: e.clientY,
			}));
		},
		[state.isDragging],
	);

	const handleMouseUp = useCallback(
		(e: React.MouseEvent) => {
			if (!state.isDragging || !state.sourceNodeId) {
				setState(INITIAL);
				return;
			}

			// Find target node under cursor
			const target = e.target as HTMLElement;
			const nodeEl = target.closest("[data-node-id]") as HTMLElement | null;
			const targetNodeId = nodeEl?.dataset.nodeId;

			if (targetNodeId && targetNodeId !== state.sourceNodeId) {
				onConnect(state.sourceNodeId, targetNodeId);
			}

			setState(INITIAL);
		},
		[state.isDragging, state.sourceNodeId, onConnect],
	);

	const cancelDrag = useCallback(() => {
		setState(INITIAL);
	}, []);

	return {
		dragState: state,
		handleDragMouseDown: handleMouseDown,
		handleDragMouseMove: handleMouseMove,
		handleDragMouseUp: handleMouseUp,
		cancelDrag,
	};
}
