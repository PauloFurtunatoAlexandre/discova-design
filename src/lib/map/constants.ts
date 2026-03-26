/** Column x-positions for auto-layout */
export const COLUMN_X = {
	insight: 0,
	problem: 400,
	solution: 800,
} as const;

/** Spacing */
export const NODE_WIDTH = 240;
export const NODE_GAP_Y = 24;
export const COLUMN_GAP = 160;

/** Zoom limits */
export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2.0;
export const ZOOM_STEP = 0.1;

/** Canvas */
export const DOT_GRID_SIZE = 24;
export const CANVAS_PADDING = 100;

/** Connection handles */
export const HANDLE_SIZE = 8;
export const HANDLE_POSITIONS = ["top", "right", "bottom"] as const;
