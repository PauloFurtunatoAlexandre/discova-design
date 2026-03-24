import { describe, expect, it, vi } from "vitest";

// Mock next/navigation to prevent redirect errors in tests
vi.mock("next/navigation", () => ({
	redirect: vi.fn((url: string) => {
		throw new Error(`REDIRECT:${url}`);
	}),
}));

// Mock auth — not authenticated
vi.mock("@/lib/auth/config", () => ({
	auth: vi.fn().mockResolvedValue(null),
}));

describe("requireAuth", () => {
	it("throws when no session exists", async () => {
		const { requireAuth } = await import("@/lib/auth/helpers");
		await expect(requireAuth()).rejects.toThrow("Authentication required");
	});
});
