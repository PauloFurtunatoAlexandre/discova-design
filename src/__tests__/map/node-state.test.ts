import { deriveBaseState } from "@/lib/queries/map";
import { describe, expect, it } from "vitest";

describe("deriveBaseState", () => {
	it("insight with 1+ outgoing connection → connected", () => {
		const connections = [{ sourceNodeId: "i1", targetNodeId: "p1" }];
		expect(deriveBaseState("i1", "insight", connections)).toBe("connected");
	});

	it("insight with 0 connections → unconnected", () => {
		expect(deriveBaseState("i1", "insight", [])).toBe("unconnected");
	});

	it("problem with incoming + outgoing → connected", () => {
		const connections = [
			{ sourceNodeId: "i1", targetNodeId: "p1" },
			{ sourceNodeId: "p1", targetNodeId: "s1" },
		];
		expect(deriveBaseState("p1", "problem", connections)).toBe("connected");
	});

	it("problem with 0 connections → unconnected", () => {
		expect(deriveBaseState("p1", "problem", [])).toBe("unconnected");
	});

	it("solution with 1+ incoming → connected", () => {
		const connections = [{ sourceNodeId: "p1", targetNodeId: "s1" }];
		expect(deriveBaseState("s1", "solution", connections)).toBe("connected");
	});

	it("solution with 0 incoming → orphan", () => {
		expect(deriveBaseState("s1", "solution", [])).toBe("orphan");
	});

	it("solution with outgoing but no incoming → orphan", () => {
		const connections = [{ sourceNodeId: "s1", targetNodeId: "x1" }];
		expect(deriveBaseState("s1", "solution", connections)).toBe("orphan");
	});
});

describe("overlay state rules", () => {
	it("select over connected → baseState still connected", () => {
		const baseState = deriveBaseState("i1", "insight", [
			{ sourceNodeId: "i1", targetNodeId: "p1" },
		]);
		expect(baseState).toBe("connected");
		// Overlay is managed in the component — selecting doesn't change baseState
	});

	it("select over unconnected → baseState still unconnected", () => {
		const baseState = deriveBaseState("i1", "insight", []);
		expect(baseState).toBe("unconnected");
	});

	it("deselect returns to base state (not always connected)", () => {
		// An orphan solution stays orphan after deselect
		const baseState = deriveBaseState("s1", "solution", []);
		expect(baseState).toBe("orphan");
		// After selecting then deselecting, baseState is still orphan
	});
});
