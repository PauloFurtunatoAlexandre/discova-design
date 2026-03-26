export type NodeType = "insight" | "problem" | "solution";

export type BaseState = "connected" | "unconnected" | "orphan";
export type OverlayState = "selected" | "hover" | "none";

export interface MapNodeData {
	id: string;
	type: NodeType;
	label: string;
	description: string | null;
	insightId: string | null;
	positionX: number;
	positionY: number;
	isCollapsed: boolean;
	createdBy: string;
	baseState: BaseState;
	connectionCount: number;
}

export interface MapConnectionData {
	id: string;
	sourceNodeId: string;
	targetNodeId: string;
}

export interface MapData {
	nodes: MapNodeData[];
	connections: MapConnectionData[];
}

/** Accent color config per node type */
export const NODE_COLORS: Record<
	NodeType,
	{
		accent: string;
		accentMuted: string;
		glow: string;
	}
> = {
	insight: {
		accent: "var(--color-accent-blue)",
		accentMuted: "var(--color-accent-blue-muted)",
		glow: "var(--shadow-glow-blue)",
	},
	problem: {
		accent: "var(--color-accent-coral)",
		accentMuted: "var(--color-accent-coral-muted)",
		glow: "var(--shadow-glow-coral)",
	},
	solution: {
		accent: "var(--color-accent-green)",
		accentMuted: "var(--color-accent-green-muted)",
		glow: "0 0 40px rgba(126,191,142,0.15)",
	},
};
