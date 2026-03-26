"use client";

import { updateNodePositionAction } from "@/actions/map";
import { useCallback, useRef, useState } from "react";

interface NodeDragState {
	isDragging: boolean;
	nodeId: string | null;
	/** Offset from cursor to node top-left, so the node doesn't jump on grab */
	offsetX: number;
	offsetY: number;
}

const INITIAL: NodeDragState = {
	isDragging: false,
	nodeId: null,
	offsetX: 0,
	offsetY: 0,
};

/**
 * Hook for dragging map nodes to reposition them.
 *
 * Returns optimistic position overrides keyed by node ID.
 * On mouseup, persists the final position via server action.
 */
export function useNodeDrag(
	zoom: number,
	pan: { x: number; y: number },
	workspaceId: string,
	projectId: string,
) {
	const [state, setState] = useState<NodeDragState>(INITIAL);
	const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
	const stateRef = useRef(state);
	stateRef.current = state;

	const startDrag = useCallback(
		(e: React.MouseEvent, nodeId: string, nodeX: number, nodeY: number) => {
			e.stopPropagation();
			e.preventDefault();

			// Calculate the offset between cursor and node's top-left corner (in canvas space)
			const offsetX = e.clientX - (nodeX * zoom + pan.x);
			const offsetY = e.clientY - (nodeY * zoom + pan.y);

			setState({
				isDragging: true,
				nodeId,
				offsetX,
				offsetY,
			});
		},
		[zoom, pan],
	);

	const handleMouseMove = useCallback(
		(e: React.MouseEvent) => {
			const s = stateRef.current;
			if (!s.isDragging || !s.nodeId) return;

			// Convert screen cursor position back to canvas coordinates
			const canvasX = (e.clientX - pan.x - s.offsetX) / zoom;
			const canvasY = (e.clientY - pan.y - s.offsetY) / zoom;

			setPositions((prev) => ({
				...prev,
				[s.nodeId as string]: { x: canvasX, y: canvasY },
			}));
		},
		[zoom, pan],
	);

	const endDrag = useCallback(() => {
		const s = stateRef.current;
		if (!s.isDragging || !s.nodeId) {
			setState(INITIAL);
			return;
		}

		const nodeId = s.nodeId;
		const pos = positions[nodeId];

		if (pos) {
			// Persist position (fire-and-forget, optimistic)
			updateNodePositionAction({
				workspaceId,
				projectId,
				nodeId,
				positionX: pos.x,
				positionY: pos.y,
			}).catch(() => {
				// Revert on failure
				setPositions((prev) => {
					const next = { ...prev };
					delete next[nodeId];
					return next;
				});
			});
		}

		setState(INITIAL);
	}, [positions, workspaceId, projectId]);

	const cancelDrag = useCallback(() => {
		const s = stateRef.current;
		if (s.nodeId) {
			setPositions((prev) => {
				const next = { ...prev };
				delete next[s.nodeId as string];
				return next;
			});
		}
		setState(INITIAL);
	}, []);

	return {
		nodeDragState: state,
		dragPositions: positions,
		startNodeDrag: startDrag,
		handleNodeDragMove: handleMouseMove,
		endNodeDrag: endDrag,
		cancelNodeDrag: cancelDrag,
	};
}
