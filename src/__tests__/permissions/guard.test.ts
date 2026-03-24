import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock all dependencies before imports
vi.mock("@/lib/auth/config", () => ({
	auth: vi.fn(),
}));

vi.mock("@/lib/permissions/check-permission", () => ({
	checkPermission: vi.fn(),
}));

vi.mock("@/lib/permissions/tier-checks", () => ({
	getTier: vi.fn(),
}));

vi.mock("@/lib/permissions/resolve-preset", () => ({
	resolvePreset: vi.fn(),
}));

vi.mock("@/lib/auth/audit", () => ({
	createAuditEntry: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/logger", () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock("@sentry/nextjs", () => ({
	addBreadcrumb: vi.fn(),
}));

import { auth } from "@/lib/auth/config";
import { logger } from "@/lib/logger";
import { checkPermission } from "@/lib/permissions/check-permission";
import { withPermission } from "@/lib/permissions/guard";
import { resolvePreset } from "@/lib/permissions/resolve-preset";
import { getTier } from "@/lib/permissions/tier-checks";
import * as Sentry from "@sentry/nextjs";

const mockAuth = vi.mocked(auth);
const mockCheckPermission = vi.mocked(checkPermission);
const mockGetTier = vi.mocked(getTier);
const mockResolvePreset = vi.mocked(resolvePreset);
const mockLogger = vi.mocked(logger);

const MOCK_SESSION = {
	user: { id: "user-1", name: "Test User", email: "test@example.com" },
	expires: new Date(Date.now() + 86400000).toISOString(),
};

const MOCK_ARGS = {
	workspaceId: "ws-1",
	projectId: "proj-1",
};

describe("withPermission guard", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("1. Authorized admin call succeeds — handler executes and returns result", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({ allowed: true });
		mockGetTier.mockResolvedValueOnce("admin");
		mockResolvePreset.mockResolvedValueOnce("member");

		const handler = vi.fn().mockResolvedValueOnce({ data: "created" });
		const action = withPermission({ phase: "vault", action: "write" }, handler);

		const result = await action(MOCK_ARGS);

		expect(handler).toHaveBeenCalledOnce();
		expect(result).toEqual({ data: "created" });
	});

	it("2. Unauthenticated call returns error without calling handler", async () => {
		mockAuth.mockResolvedValueOnce(null as never);

		const handler = vi.fn();
		const action = withPermission({ phase: "vault", action: "write" }, handler);

		const result = await action(MOCK_ARGS);

		expect(result).toEqual({ error: "Authentication required. Please sign in." });
		expect(handler).not.toHaveBeenCalled();
		expect(mockCheckPermission).not.toHaveBeenCalled();
	});

	it("3. Unauthorized viewer write returns error — handler never executes", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({
			allowed: false,
			reason: "Viewers have read-only access.",
		});

		const handler = vi.fn();
		const action = withPermission({ phase: "vault", action: "write" }, handler);

		const result = await action(MOCK_ARGS);

		expect(result).toEqual({ error: "Viewers have read-only access." });
		expect(handler).not.toHaveBeenCalled();
	});

	it("4. Denial is logged with expected fields", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({
			allowed: false,
			reason: "Viewers have read-only access.",
		});

		const action = withPermission({ phase: "stack", action: "write" }, vi.fn());
		await action(MOCK_ARGS);

		expect(mockLogger.warn).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				workspaceId: "ws-1",
				projectId: "proj-1",
				phase: "stack",
				action: "write",
			}),
			"Server Action permission denied",
		);
	});

	it("4b. Denial adds Sentry breadcrumb", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({
			allowed: false,
			reason: "Viewers have read-only access.",
		});

		const action = withPermission({ phase: "vault", action: "write" }, vi.fn());
		await action(MOCK_ARGS);

		expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
			expect.objectContaining({
				category: "permissions",
				level: "warning",
			}),
		);
	});

	it("Auth context passed to handler contains correct fields", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({ allowed: true });
		mockGetTier.mockResolvedValueOnce("member");
		mockResolvePreset.mockResolvedValueOnce("researcher");

		const handler = vi.fn().mockResolvedValueOnce({ ok: true });
		const action = withPermission({ phase: "vault", action: "write" }, handler);
		await action(MOCK_ARGS);

		expect(handler).toHaveBeenCalledWith(
			expect.objectContaining({
				userId: "user-1",
				workspaceId: "ws-1",
				projectId: "proj-1",
				tier: "member",
				preset: "researcher",
			}),
			MOCK_ARGS,
		);
	});

	it("Returns generic error when denial has no reason string", async () => {
		mockAuth.mockResolvedValueOnce(MOCK_SESSION as never);
		mockCheckPermission.mockResolvedValueOnce({ allowed: false });

		const action = withPermission({ phase: "vault", action: "write" }, vi.fn());
		const result = await action(MOCK_ARGS);

		expect(result).toEqual({ error: "Permission denied." });
	});
});
