import {
	canEditPhase,
	canViewPhase,
	getAllPhasePermissions,
	getPhasePermission,
} from "@/lib/permissions/phase-access";
import { describe, expect, it } from "vitest";

describe("Phase Access Matrix", () => {
	describe("researcher", () => {
		it("can edit vault", () => expect(canEditPhase("researcher", "vault")).toBe(true));
		it("can edit engine", () => expect(canEditPhase("researcher", "engine")).toBe(true));
		it("can edit map", () => expect(canEditPhase("researcher", "map")).toBe(true));
		it("cannot edit stack", () => expect(canEditPhase("researcher", "stack")).toBe(false));
		it("cannot edit team", () => expect(canEditPhase("researcher", "team")).toBe(false));
		it("can view stack (read-only)", () => expect(canViewPhase("researcher", "stack")).toBe(true));
		it("can view team (read-only)", () => expect(canViewPhase("researcher", "team")).toBe(true));
		it("stack permission is read", () =>
			expect(getPhasePermission("researcher", "stack")).toBe("read"));
		it("team permission is read", () =>
			expect(getPhasePermission("researcher", "team")).toBe("read"));
		it("vault permission is write", () =>
			expect(getPhasePermission("researcher", "vault")).toBe("write"));
	});

	describe("pm", () => {
		it("cannot edit vault", () => expect(canEditPhase("pm", "vault")).toBe(false));
		it("cannot edit engine", () => expect(canEditPhase("pm", "engine")).toBe(false));
		it("can edit map", () => expect(canEditPhase("pm", "map")).toBe(true));
		it("can edit stack", () => expect(canEditPhase("pm", "stack")).toBe(true));
		it("can edit team", () => expect(canEditPhase("pm", "team")).toBe(true));
		it("can view vault (read-only)", () => expect(canViewPhase("pm", "vault")).toBe(true));
		it("can view engine (read-only)", () => expect(canViewPhase("pm", "engine")).toBe(true));
		it("vault permission is read", () => expect(getPhasePermission("pm", "vault")).toBe("read"));
		it("engine permission is read", () => expect(getPhasePermission("pm", "engine")).toBe("read"));
		it("stack permission is write", () => expect(getPhasePermission("pm", "stack")).toBe("write"));
	});

	describe("member", () => {
		it("can edit vault", () => expect(canEditPhase("member", "vault")).toBe(true));
		it("can edit engine", () => expect(canEditPhase("member", "engine")).toBe(true));
		it("can edit map", () => expect(canEditPhase("member", "map")).toBe(true));
		it("can edit stack", () => expect(canEditPhase("member", "stack")).toBe(true));
		it("can edit team", () => expect(canEditPhase("member", "team")).toBe(true));
		it("can view all phases", () => {
			const phases = ["vault", "engine", "map", "stack", "team"] as const;
			for (const phase of phases) {
				expect(canViewPhase("member", phase)).toBe(true);
			}
		});
	});

	describe("no_access", () => {
		it("cannot view vault", () => expect(canViewPhase("no_access", "vault")).toBe(false));
		it("cannot view engine", () => expect(canViewPhase("no_access", "engine")).toBe(false));
		it("cannot view map", () => expect(canViewPhase("no_access", "map")).toBe(false));
		it("cannot view stack", () => expect(canViewPhase("no_access", "stack")).toBe(false));
		it("cannot view team", () => expect(canViewPhase("no_access", "team")).toBe(false));
		it("cannot edit any phase", () => {
			const phases = ["vault", "engine", "map", "stack", "team"] as const;
			for (const phase of phases) {
				expect(canEditPhase("no_access", phase)).toBe(false);
			}
		});
		it("all permissions are none", () => {
			const phases = ["vault", "engine", "map", "stack", "team"] as const;
			for (const phase of phases) {
				expect(getPhasePermission("no_access", phase)).toBe("none");
			}
		});
	});

	describe("getAllPhasePermissions", () => {
		it("returns full matrix for researcher", () => {
			const perms = getAllPhasePermissions("researcher");
			expect(perms).toEqual({
				vault: "write",
				engine: "write",
				map: "write",
				stack: "read",
				team: "read",
			});
		});

		it("returns full matrix for pm", () => {
			const perms = getAllPhasePermissions("pm");
			expect(perms).toEqual({
				vault: "read",
				engine: "read",
				map: "write",
				stack: "write",
				team: "write",
			});
		});

		it("returns a copy, not the original object", () => {
			const perms1 = getAllPhasePermissions("member");
			const perms2 = getAllPhasePermissions("member");
			expect(perms1).not.toBe(perms2);
		});
	});
});
