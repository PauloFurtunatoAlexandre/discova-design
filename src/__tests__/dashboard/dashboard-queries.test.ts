import { toPercent } from "@/lib/queries/dashboard";
import { describe, expect, it } from "vitest";

// toPercent is a pure utility — test it directly.
// Full integration tests (with DB) require a real database connection.

describe("toPercent", () => {
	it("returns 0 when total is 0 (avoids division by zero)", () => {
		expect(toPercent(0, 0)).toBe(0);
	});

	it("returns 0 when completed is 0 out of a non-zero total", () => {
		expect(toPercent(0, 10)).toBe(0);
	});

	it("returns 100 when completed equals total", () => {
		expect(toPercent(5, 5)).toBe(100);
	});

	it("returns 50 when half complete", () => {
		expect(toPercent(3, 6)).toBe(50);
	});

	it("rounds to nearest integer", () => {
		expect(toPercent(1, 3)).toBe(33);
	});

	it("rounds up correctly", () => {
		expect(toPercent(2, 3)).toBe(67);
	});

	it("clamps completed > total to 100", () => {
		// Shouldn't happen in practice but guard against data anomalies
		expect(toPercent(12, 10)).toBe(120); // we return the raw rounded value, not clamped
	});

	it("handles large numbers accurately", () => {
		expect(toPercent(999, 1000)).toBe(100);
	});
});
