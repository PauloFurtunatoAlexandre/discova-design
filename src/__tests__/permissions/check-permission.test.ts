import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies
vi.mock("@/lib/permissions/tier-checks", () => ({
	getTier: vi.fn(),
}));

vi.mock("@/lib/permissions/resolve-preset", () => ({
	resolvePreset: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { checkPermission } from "@/lib/permissions/check-permission";
import { resolvePreset } from "@/lib/permissions/resolve-preset";
import { getTier } from "@/lib/permissions/tier-checks";

const mockGetTier = vi.mocked(getTier);
const mockResolvePreset = vi.mocked(resolvePreset);

const BASE = {
	userId: "user-1",
	workspaceId: "ws-1",
	projectId: "proj-1",
};

describe("checkPermission", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Admin tier", () => {
		it("1. Admin can always write to stack", async () => {
			mockGetTier.mockResolvedValueOnce("admin");
			const result = await checkPermission({ ...BASE, phase: "stack", action: "write" });
			expect(result.allowed).toBe(true);
			expect(mockResolvePreset).not.toHaveBeenCalled();
		});

		it("2. Admin can write to vault", async () => {
			mockGetTier.mockResolvedValueOnce("admin");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "write" });
			expect(result.allowed).toBe(true);
		});

		it("Admin can read every phase", async () => {
			const phases = ["vault", "engine", "map", "stack", "team"] as const;
			for (const phase of phases) {
				mockGetTier.mockResolvedValueOnce("admin");
				const result = await checkPermission({ ...BASE, phase, action: "read" });
				expect(result.allowed).toBe(true);
			}
		});
	});

	describe("Viewer tier", () => {
		it("3. Viewer can read vault", async () => {
			mockGetTier.mockResolvedValueOnce("viewer");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "read" });
			expect(result.allowed).toBe(true);
		});

		it("3. Viewer cannot write vault", async () => {
			mockGetTier.mockResolvedValueOnce("viewer");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "write" });
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("read-only");
		});

		it("Viewer cannot write any phase", async () => {
			const phases = ["vault", "engine", "map", "stack", "team"] as const;
			for (const phase of phases) {
				mockGetTier.mockResolvedValueOnce("viewer");
				const result = await checkPermission({ ...BASE, phase, action: "write" });
				expect(result.allowed).toBe(false);
			}
		});
	});

	describe("Member + Researcher preset", () => {
		it("4. Researcher denied stack write — reason includes read-only", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("researcher");
			const result = await checkPermission({ ...BASE, phase: "stack", action: "write" });
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("read-only access");
		});

		it("Researcher allowed stack read", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("researcher");
			const result = await checkPermission({ ...BASE, phase: "stack", action: "read" });
			expect(result.allowed).toBe(true);
		});

		it("Researcher allowed vault write", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("researcher");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "write" });
			expect(result.allowed).toBe(true);
		});
	});

	describe("Member + PM preset", () => {
		it("5. PM denied vault write", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("pm");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "write" });
			expect(result.allowed).toBe(false);
		});

		it("5. PM denied engine write", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("pm");
			const result = await checkPermission({ ...BASE, phase: "engine", action: "write" });
			expect(result.allowed).toBe(false);
		});

		it("6. PM allowed stack write", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("pm");
			const result = await checkPermission({ ...BASE, phase: "stack", action: "write" });
			expect(result.allowed).toBe(true);
		});

		it("PM allowed vault read", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("pm");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "read" });
			expect(result.allowed).toBe(true);
		});
	});

	describe("Non-member / no_access", () => {
		it("7. User not in workspace — tier is null", async () => {
			mockGetTier.mockResolvedValueOnce(null);
			const result = await checkPermission({ ...BASE, phase: "vault", action: "read" });
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("not a member");
		});

		it("8. no_access preset — specific error message", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("no_access");
			const result = await checkPermission({ ...BASE, phase: "vault", action: "read" });
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("role has not been configured");
		});

		it("no_access preset — blocked for write too", async () => {
			mockGetTier.mockResolvedValueOnce("member");
			mockResolvePreset.mockResolvedValueOnce("no_access");
			const result = await checkPermission({ ...BASE, phase: "stack", action: "write" });
			expect(result.allowed).toBe(false);
			expect(result.reason).toContain("role has not been configured");
		});
	});
});
