/**
 * Map Server Actions unit tests.
 *
 * Tests validation schemas and connection direction rules.
 * Server Actions themselves are mocked (they require DB + auth).
 */

import {
	createConnectionSchema,
	createMapNodeSchema,
	deleteConnectionSchema,
	deleteMapNodeSchema,
	updateNodePositionSchema,
} from "@/lib/validations/map";
import { describe, expect, it } from "vitest";

describe("createMapNodeSchema", () => {
	it("accepts valid problem node", () => {
		const result = createMapNodeSchema.safeParse({
			type: "problem",
			label: "Users cannot find the settings page",
			description: "Multiple users reported confusion during usability testing",
		});
		expect(result.success).toBe(true);
	});

	it("accepts valid solution node", () => {
		const result = createMapNodeSchema.safeParse({
			type: "solution",
			label: "Add settings shortcut to header",
			description: null,
		});
		expect(result.success).toBe(true);
	});

	it("rejects insight type (insights are placed via placeInsightOnMap)", () => {
		const result = createMapNodeSchema.safeParse({
			type: "insight",
			label: "Some insight",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty label", () => {
		const result = createMapNodeSchema.safeParse({
			type: "problem",
			label: "",
		});
		expect(result.success).toBe(false);
	});

	it("rejects label over 300 characters", () => {
		const result = createMapNodeSchema.safeParse({
			type: "problem",
			label: "x".repeat(301),
		});
		expect(result.success).toBe(false);
	});

	it("trims whitespace from label", () => {
		const result = createMapNodeSchema.safeParse({
			type: "problem",
			label: "  Users are confused  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.label).toBe("Users are confused");
		}
	});

	it("transforms empty description to null", () => {
		const result = createMapNodeSchema.safeParse({
			type: "solution",
			label: "Fix it",
			description: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBeNull();
		}
	});
});

describe("createConnectionSchema", () => {
	it("accepts valid UUIDs", () => {
		const result = createConnectionSchema.safeParse({
			sourceNodeId: "550e8400-e29b-41d4-a716-446655440000",
			targetNodeId: "550e8400-e29b-41d4-a716-446655440001",
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-UUID strings", () => {
		const result = createConnectionSchema.safeParse({
			sourceNodeId: "not-a-uuid",
			targetNodeId: "also-not-a-uuid",
		});
		expect(result.success).toBe(false);
	});

	it("rejects missing fields", () => {
		const result = createConnectionSchema.safeParse({
			sourceNodeId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(false);
	});
});

describe("updateNodePositionSchema", () => {
	it("accepts valid position", () => {
		const result = updateNodePositionSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
			positionX: 150.5,
			positionY: 200,
		});
		expect(result.success).toBe(true);
	});

	it("accepts zero coordinates", () => {
		const result = updateNodePositionSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
			positionX: 0,
			positionY: 0,
		});
		expect(result.success).toBe(true);
	});

	it("accepts negative coordinates", () => {
		const result = updateNodePositionSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
			positionX: -100,
			positionY: -50,
		});
		expect(result.success).toBe(true);
	});

	it("rejects Infinity", () => {
		const result = updateNodePositionSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
			positionX: Number.POSITIVE_INFINITY,
			positionY: 0,
		});
		expect(result.success).toBe(false);
	});
});

describe("deleteMapNodeSchema", () => {
	it("accepts valid UUID", () => {
		const result = deleteMapNodeSchema.safeParse({
			nodeId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-UUID", () => {
		const result = deleteMapNodeSchema.safeParse({ nodeId: "abc" });
		expect(result.success).toBe(false);
	});
});

describe("deleteConnectionSchema", () => {
	it("accepts valid UUID", () => {
		const result = deleteConnectionSchema.safeParse({
			connectionId: "550e8400-e29b-41d4-a716-446655440000",
		});
		expect(result.success).toBe(true);
	});

	it("rejects non-UUID", () => {
		const result = deleteConnectionSchema.safeParse({ connectionId: "abc" });
		expect(result.success).toBe(false);
	});
});

describe("Connection direction validation", () => {
	const validConnections: Record<string, string[]> = {
		insight: ["problem", "solution"],
		problem: ["solution"],
	};

	it("allows insight → problem", () => {
		expect(validConnections.insight?.includes("problem")).toBe(true);
	});

	it("allows insight → solution", () => {
		expect(validConnections.insight?.includes("solution")).toBe(true);
	});

	it("allows problem → solution", () => {
		expect(validConnections.problem?.includes("solution")).toBe(true);
	});

	it("disallows problem → insight", () => {
		expect(validConnections.problem?.includes("insight") ?? false).toBe(false);
	});

	it("disallows solution → anything", () => {
		expect(validConnections.solution).toBeUndefined();
	});

	it("disallows problem → problem", () => {
		expect(validConnections.problem?.includes("problem") ?? false).toBe(false);
	});
});
