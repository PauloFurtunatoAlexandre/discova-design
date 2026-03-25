/**
 * useAutoSave hook tests.
 *
 * Uses fake timers to control setTimeout without actually waiting.
 */

import { useAutoSave } from "@/hooks/useAutoSave";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("useAutoSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not call onSave immediately after triggerSave", () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() => useAutoSave({ delay: 2000, onSave }));

		act(() => {
			result.current.triggerSave("hello");
		});

		expect(onSave).not.toHaveBeenCalled();
		expect(result.current.status).toBe("idle");
	});

	it("calls onSave after the delay", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() => useAutoSave({ delay: 2000, onSave }));

		act(() => {
			result.current.triggerSave("hello");
		});

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});

		expect(onSave).toHaveBeenCalledWith("hello");
	});

	it("debounces rapid calls — only saves the latest value", async () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result } = renderHook(() => useAutoSave({ delay: 2000, onSave }));

		act(() => {
			result.current.triggerSave("first");
			result.current.triggerSave("second");
			result.current.triggerSave("third");
		});

		await act(async () => {
			vi.advanceTimersByTime(2000);
		});

		expect(onSave).toHaveBeenCalledTimes(1);
		expect(onSave).toHaveBeenCalledWith("third");
	});

	it("transitions: idle → saving → saved → idle", async () => {
		let resolveSave!: () => void;
		const onSave = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveSave = resolve;
				}),
		);
		const { result } = renderHook(() => useAutoSave({ delay: 100, onSave }));

		act(() => {
			result.current.triggerSave("data");
		});
		expect(result.current.status).toBe("idle");

		// Trigger the debounced save
		await act(async () => {
			vi.advanceTimersByTime(100);
		});
		expect(result.current.status).toBe("saving");

		// Resolve the save
		await act(async () => {
			resolveSave();
		});
		expect(result.current.status).toBe("saved");

		// Wait for the 2-second idle reset
		await act(async () => {
			vi.advanceTimersByTime(2000);
		});
		expect(result.current.status).toBe("idle");
	});

	it("shows error status when save throws", async () => {
		const onSave = vi.fn().mockRejectedValue(new Error("Network error"));
		const { result } = renderHook(() => useAutoSave({ delay: 100, onSave }));

		act(() => {
			result.current.triggerSave("data");
		});

		await act(async () => {
			vi.advanceTimersByTime(100);
		});

		expect(result.current.status).toBe("error");
	});

	it("cleanup: unmount clears pending timeout (no memory leak)", () => {
		const onSave = vi.fn().mockResolvedValue(undefined);
		const { result, unmount } = renderHook(() => useAutoSave({ delay: 2000, onSave }));

		act(() => {
			result.current.triggerSave("hello");
		});

		unmount();

		// Timer should be cleared — advancing time should not call onSave
		act(() => {
			vi.advanceTimersByTime(2000);
		});

		expect(onSave).not.toHaveBeenCalled();
	});
});
