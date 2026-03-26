"use client";

import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "@/lib/map/constants";
import { type MouseEvent, type WheelEvent, useCallback, useRef, useState } from "react";

/**
 * Hook managing canvas pan and zoom state.
 *
 * Pan: click and drag on canvas background (not on nodes)
 * Zoom: scroll wheel / pinch
 */
export function useCanvas() {
	const [pan, setPan] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [isPanning, setIsPanning] = useState(false);
	const lastMouseRef = useRef({ x: 0, y: 0 });

	const handleWheel = useCallback((e: WheelEvent) => {
		e.preventDefault();
		const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
		setZoom((prev) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, prev + delta)));
	}, []);

	const handleMouseDown = useCallback((e: MouseEvent) => {
		if ((e.target as HTMLElement).dataset.canvasBackground !== undefined) {
			setIsPanning(true);
			lastMouseRef.current = { x: e.clientX, y: e.clientY };
		}
	}, []);

	const handleMouseMove = useCallback(
		(e: MouseEvent) => {
			if (!isPanning) return;
			const dx = e.clientX - lastMouseRef.current.x;
			const dy = e.clientY - lastMouseRef.current.y;
			lastMouseRef.current = { x: e.clientX, y: e.clientY };
			setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
		},
		[isPanning],
	);

	const handleMouseUp = useCallback(() => {
		setIsPanning(false);
	}, []);

	const zoomIn = useCallback(() => {
		setZoom((prev) => Math.min(ZOOM_MAX, prev + ZOOM_STEP));
	}, []);

	const zoomOut = useCallback(() => {
		setZoom((prev) => Math.max(ZOOM_MIN, prev - ZOOM_STEP));
	}, []);

	const fitToView = useCallback(
		(
			bounds: { minX: number; minY: number; width: number; height: number },
			containerWidth: number,
			containerHeight: number,
		) => {
			const scaleX = containerWidth / bounds.width;
			const scaleY = containerHeight / bounds.height;
			const newZoom = Math.min(scaleX, scaleY, ZOOM_MAX) * 0.9;
			const clampedZoom = Math.max(ZOOM_MIN, newZoom);
			setZoom(clampedZoom);
			setPan({
				x: -bounds.minX * clampedZoom + (containerWidth - bounds.width * clampedZoom) / 2,
				y: -bounds.minY * clampedZoom + (containerHeight - bounds.height * clampedZoom) / 2,
			});
		},
		[],
	);

	const resetView = useCallback(() => {
		setPan({ x: 0, y: 0 });
		setZoom(1);
	}, []);

	return {
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
	};
}
