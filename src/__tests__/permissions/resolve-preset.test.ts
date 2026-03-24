import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock the db module before importing resolvePreset
vi.mock("@/lib/db", () => ({
	db: {
		query: {
			projectMembers: { findFirst: vi.fn() },
			workspaceMembers: { findFirst: vi.fn() },
			users: { findFirst: vi.fn() },
		},
	},
}));

import { db } from "@/lib/db";
import { resolvePreset } from "@/lib/permissions/resolve-preset";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockDb = db as unknown as {
	query: {
		projectMembers: { findFirst: ReturnType<typeof vi.fn> };
		workspaceMembers: { findFirst: ReturnType<typeof vi.fn> };
		users: { findFirst: ReturnType<typeof vi.fn> };
	};
};

const USER_ID = "user-1";
const PROJECT_ID = "project-1";
const WORKSPACE_ID = "workspace-1";

describe("resolvePreset — cascade algorithm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("1. Project override wins over workspace and global", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce({
			projectPreset: "member",
		});

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("member");
		// Should not even query workspace or users
		expect(mockDb.query.workspaceMembers.findFirst).not.toHaveBeenCalled();
		expect(mockDb.query.users.findFirst).not.toHaveBeenCalled();
	});

	it("2. Workspace preset wins when no project override", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce(null);
		mockDb.query.workspaceMembers.findFirst.mockResolvedValueOnce({
			workspacePreset: "pm",
		});

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("pm");
		expect(mockDb.query.users.findFirst).not.toHaveBeenCalled();
	});

	it("3. Global preset wins when no project or workspace override", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce(null);
		mockDb.query.workspaceMembers.findFirst.mockResolvedValueOnce({
			workspacePreset: null,
		});
		mockDb.query.users.findFirst.mockResolvedValueOnce({
			globalPreset: "researcher",
		});

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("researcher");
	});

	it("4. Returns no_access when no preset set anywhere", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce(null);
		mockDb.query.workspaceMembers.findFirst.mockResolvedValueOnce({
			workspacePreset: null,
		});
		mockDb.query.users.findFirst.mockResolvedValueOnce({
			globalPreset: null,
		});

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("no_access");
	});

	it("4b. Returns no_access when user not found", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce(null);
		mockDb.query.workspaceMembers.findFirst.mockResolvedValueOnce({
			workspacePreset: null,
		});
		mockDb.query.users.findFirst.mockResolvedValueOnce(null);

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("no_access");
	});

	it("5. Null project_preset falls through to workspace", async () => {
		mockDb.query.projectMembers.findFirst.mockResolvedValueOnce({
			projectPreset: null,
		});
		mockDb.query.workspaceMembers.findFirst.mockResolvedValueOnce({
			workspacePreset: "researcher",
		});

		const result = await resolvePreset(USER_ID, PROJECT_ID, WORKSPACE_ID);
		expect(result).toBe("researcher");
	});
});
