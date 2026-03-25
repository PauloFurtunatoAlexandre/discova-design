import {
	_resetForTesting,
	acquireWorkspaceConcurrency,
	checkAnalysisRateLimit,
	releaseWorkspaceConcurrency,
} from "@/lib/engine/rate-limit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("checkAnalysisRateLimit", () => {
	beforeEach(() => {
		_resetForTesting();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("allows first request with remaining = 9", () => {
		const result = checkAnalysisRateLimit("user-1");
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(9);
	});

	it("allows 10th request with remaining = 0", () => {
		for (let i = 0; i < 9; i++) checkAnalysisRateLimit("user-2");
		const result = checkAnalysisRateLimit("user-2");
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(0);
	});

	it("denies 11th request and returns retryAfterSeconds", () => {
		for (let i = 0; i < 10; i++) checkAnalysisRateLimit("user-3");
		const result = checkAnalysisRateLimit("user-3");
		expect(result.allowed).toBe(false);
		expect(result.remaining).toBe(0);
		expect(result.retryAfterSeconds).toBeGreaterThan(0);
	});

	it("resets count after window expires", () => {
		for (let i = 0; i < 10; i++) checkAnalysisRateLimit("user-4");
		// Advance time past 1 hour window
		vi.advanceTimersByTime(60 * 60 * 1000 + 1);
		const result = checkAnalysisRateLimit("user-4");
		expect(result.allowed).toBe(true);
		expect(result.remaining).toBe(9);
	});
});

describe("workspace concurrency", () => {
	beforeEach(() => {
		_resetForTesting();
	});

	it("allows 3 concurrent analyses", () => {
		expect(acquireWorkspaceConcurrency("ws-1")).toBe(true);
		expect(acquireWorkspaceConcurrency("ws-1")).toBe(true);
		expect(acquireWorkspaceConcurrency("ws-1")).toBe(true);
	});

	it("denies 4th concurrent analysis", () => {
		acquireWorkspaceConcurrency("ws-2");
		acquireWorkspaceConcurrency("ws-2");
		acquireWorkspaceConcurrency("ws-2");
		expect(acquireWorkspaceConcurrency("ws-2")).toBe(false);
	});

	it("allows new analysis after release", () => {
		acquireWorkspaceConcurrency("ws-3");
		acquireWorkspaceConcurrency("ws-3");
		acquireWorkspaceConcurrency("ws-3");
		releaseWorkspaceConcurrency("ws-3");
		expect(acquireWorkspaceConcurrency("ws-3")).toBe(true);
	});

	it("does not go below 0 on over-release", () => {
		releaseWorkspaceConcurrency("ws-4");
		releaseWorkspaceConcurrency("ws-4");
		// Should not throw
		expect(acquireWorkspaceConcurrency("ws-4")).toBe(true);
	});
});
