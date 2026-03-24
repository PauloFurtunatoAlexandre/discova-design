import { createWorkspaceSchema, updateWorkspaceSchema } from "@/lib/validations/workspaces";
import { describe, expect, it } from "vitest";

// Tests validate the Zod schemas used by workspace server actions.
// Full integration tests (with DB) require a real database connection.

describe("createWorkspaceSchema", () => {
	it("accepts a valid workspace name", () => {
		const result = createWorkspaceSchema.safeParse({ name: "Acme Research" });
		expect(result.success).toBe(true);
	});

	it("accepts a valid name with a logo URL", () => {
		const result = createWorkspaceSchema.safeParse({
			name: "Acme Research",
			logoUrl: "https://example.com/logo.png",
		});
		expect(result.success).toBe(true);
	});

	it("accepts an empty logoUrl (treated as optional)", () => {
		const result = createWorkspaceSchema.safeParse({ name: "My WS", logoUrl: "" });
		expect(result.success).toBe(true);
	});

	it("rejects an empty name", () => {
		const result = createWorkspaceSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects a name over 100 characters", () => {
		const result = createWorkspaceSchema.safeParse({ name: "A".repeat(101) });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("trims whitespace from name", () => {
		const result = createWorkspaceSchema.safeParse({ name: "  Acme  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Acme");
		}
	});

	it("rejects an invalid logo URL", () => {
		const result = createWorkspaceSchema.safeParse({
			name: "Acme",
			logoUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.logoUrl).toBeDefined();
	});

	it("accepts name at exactly 100 characters", () => {
		const result = createWorkspaceSchema.safeParse({ name: "A".repeat(100) });
		expect(result.success).toBe(true);
	});
});

describe("updateWorkspaceSchema", () => {
	it("accepts updating only the name", () => {
		const result = updateWorkspaceSchema.safeParse({ name: "New Name" });
		expect(result.success).toBe(true);
	});

	it("accepts updating only the logoUrl", () => {
		const result = updateWorkspaceSchema.safeParse({
			logoUrl: "https://example.com/new-logo.png",
		});
		expect(result.success).toBe(true);
	});

	it("accepts an empty object (no fields to update)", () => {
		const result = updateWorkspaceSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("rejects a name that is explicitly empty string", () => {
		const result = updateWorkspaceSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects a name over 100 characters", () => {
		const result = updateWorkspaceSchema.safeParse({ name: "A".repeat(101) });
		expect(result.success).toBe(false);
	});

	it("trims whitespace from name", () => {
		const result = updateWorkspaceSchema.safeParse({ name: "  Trimmed  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Trimmed");
		}
	});
});
