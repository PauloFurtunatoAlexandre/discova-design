"use client";

import type { BaseState, OverlayState } from "@/lib/map/types";
import { useCallback, useState } from "react";

/**
 * Derive the full visual state of a node.
 * Base state (connected/unconnected/orphan) + overlay (selected/hover).
 * Overlay layers ON TOP of base — removing overlay returns to base.
 */
export function useNodeState(baseState: BaseState) {
	const [overlay, setOverlay] = useState<OverlayState>("none");

	const select = useCallback(() => setOverlay("selected"), []);
	const deselect = useCallback(() => setOverlay("none"), []);
	const hover = useCallback(() => {
		setOverlay((prev) => (prev !== "selected" ? "hover" : prev));
	}, []);
	const unhover = useCallback(() => {
		setOverlay((prev) => (prev === "hover" ? "none" : prev));
	}, []);

	return {
		baseState,
		overlay,
		isSelected: overlay === "selected",
		isHovered: overlay === "hover",
		select,
		deselect,
		hover,
		unhover,
	};
}
