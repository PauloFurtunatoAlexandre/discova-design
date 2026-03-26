/**
 * Canvas component tests.
 *
 * Tests rendering of canvas, nodes, connections, selection, and empty state.
 * Uses jsdom environment with React Testing Library.
 */

import { MapCanvas } from "@/components/map/map-canvas";
import type { MapData, MapNodeData } from "@/lib/map/types";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useRouter: () => ({
		push: vi.fn(),
		refresh: vi.fn(),
	}),
}));

function makeNode(
	overrides: Partial<MapNodeData> & { id: string; type: MapNodeData["type"] },
): MapNodeData {
	return {
		label: `${overrides.type} node`,
		description: null,
		insightId: null,
		positionX: overrides.type === "insight" ? 0 : overrides.type === "problem" ? 400 : 800,
		positionY: 100,
		isCollapsed: false,
		createdBy: "u1",
		baseState: "connected",
		connectionCount: 1,
		...overrides,
	};
}

const connectedMapData: MapData = {
	nodes: [
		makeNode({ id: "i1", type: "insight", label: "Insight Alpha" }),
		makeNode({ id: "p1", type: "problem", label: "Problem Beta" }),
		makeNode({
			id: "s1",
			type: "solution",
			label: "Solution Gamma",
			baseState: "orphan",
			connectionCount: 0,
		}),
	],
	connections: [{ id: "c1", sourceNodeId: "i1", targetNodeId: "p1" }],
};

const emptyMapData: MapData = { nodes: [], connections: [] };

afterEach(cleanup);

describe("MapCanvas", () => {
	it("renders with dot grid background", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const canvas = screen.getByTestId("map-canvas");
		expect(canvas).toBeDefined();
		expect(canvas.style.backgroundImage).toContain("radial-gradient");
	});

	it("renders all 3 node types", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		expect(screen.getByText("Insight Alpha")).toBeDefined();
		expect(screen.getByText("Problem Beta")).toBeDefined();
		expect(screen.getByText("Solution Gamma")).toBeDefined();
	});

	it("node click toggles selected state", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const insightNode = screen.getByText("Insight Alpha").closest("[data-testid='map-node']");
		expect(insightNode).toBeDefined();

		// Click to select
		// biome-ignore lint/style/noNonNullAssertion: test assertion — element found by getByText
		fireEvent.click(insightNode!);
		expect(insightNode?.getAttribute("aria-selected")).toBe("true");

		// Click again to deselect
		// biome-ignore lint/style/noNonNullAssertion: test assertion — element found by getByText
		fireEvent.click(insightNode!);
		expect(insightNode?.getAttribute("aria-selected")).toBe("false");
	});

	it("Escape key deselects", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const insightNode = screen.getByText("Insight Alpha").closest("[data-testid='map-node']");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — element found by getByText
		fireEvent.click(insightNode!);
		expect(insightNode?.getAttribute("aria-selected")).toBe("true");

		fireEvent.keyDown(document, { key: "Escape" });
		expect(insightNode?.getAttribute("aria-selected")).toBe("false");
	});

	it("connected node has solid border style", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const node = screen.getByText("Insight Alpha").closest("[data-testid='map-node']");
		expect(node?.getAttribute("data-base-state")).toBe("connected");
	});

	it("unconnected node shows 'Unlinked' label", () => {
		const data: MapData = {
			nodes: [
				makeNode({
					id: "i1",
					type: "insight",
					label: "Lonely Insight",
					baseState: "unconnected",
					connectionCount: 0,
				}),
			],
			connections: [],
		};
		render(<MapCanvas mapData={data} canEdit workspaceId="ws1" projectId="proj1" />);
		expect(screen.getByText("Unlinked")).toBeDefined();
	});

	it("orphan solution shows warning icon", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const solutionNode = screen.getByText("Solution Gamma").closest("[data-testid='map-node']");
		expect(solutionNode?.getAttribute("data-base-state")).toBe("orphan");
		// Warning icon (AlertTriangle) should be present inside the orphan node
		const warningIcons = solutionNode?.querySelectorAll("svg");
		expect(warningIcons?.length).toBeGreaterThan(0);
	});

	it("connection line renders between connected nodes", () => {
		const { container } = render(
			<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />,
		);
		const paths = container.querySelectorAll("path[d]");
		// Should have at least 1 connection path + 1 arrow marker
		expect(paths.length).toBeGreaterThanOrEqual(1);
	});

	it("zoom controls work", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		// Toolbar renders zoom percentage
		expect(screen.getByText("100%")).toBeDefined();

		// Zoom in
		fireEvent.click(screen.getByLabelText("Zoom in"));
		expect(screen.getByText("110%")).toBeDefined();

		// Zoom out
		fireEvent.click(screen.getByLabelText("Zoom out"));
		expect(screen.getByText("100%")).toBeDefined();
	});

	it("empty state shows when no nodes exist", () => {
		render(<MapCanvas mapData={emptyMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		expect(screen.getByText("Your opportunity map is empty")).toBeDefined();
		expect(screen.getByText(/Go to Engine/)).toBeDefined();
	});

	it("selected node shows connection handles when canEdit is true", () => {
		render(<MapCanvas mapData={connectedMapData} canEdit workspaceId="ws1" projectId="proj1" />);
		const insightNode = screen.getByText("Insight Alpha").closest("[data-testid='map-node']");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — element found by getByText
		fireEvent.click(insightNode!);

		// 3 handles should appear
		const handles = insightNode?.querySelectorAll("[data-handle]");
		expect(handles?.length).toBe(3);
	});

	it("selected node does not show handles when canEdit is false", () => {
		render(
			<MapCanvas mapData={connectedMapData} canEdit={false} workspaceId="ws1" projectId="proj1" />,
		);
		const insightNode = screen.getByText("Insight Alpha").closest("[data-testid='map-node']");
		// biome-ignore lint/style/noNonNullAssertion: test assertion — element found by getByText
		fireEvent.click(insightNode!);

		const handles = insightNode?.querySelectorAll("[data-handle]");
		expect(handles?.length).toBe(0);
	});
});
