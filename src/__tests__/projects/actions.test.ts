import { createProjectSchema, updateProjectSchema } from "@/lib/validations/projects";
import { describe, expect, it } from "vitest";

// Schema tests validate the Zod schemas used by project server actions.
// Full integration tests (with DB) require a real database connection.

describe("createProjectSchema", () => {
	it("accepts a valid project name", () => {
		const result = createProjectSchema.safeParse({ name: "Mobile App" });
		expect(result.success).toBe(true);
	});

	it("accepts a name with a description", () => {
		const result = createProjectSchema.safeParse({
			name: "Checkout Flow",
			description: "Covers the full checkout experience from cart to confirmation.",
		});
		expect(result.success).toBe(true);
	});

	it("accepts an empty description (optional)", () => {
		const result = createProjectSchema.safeParse({ name: "Onboarding", description: "" });
		expect(result.success).toBe(true);
	});

	it("accepts omitted description (optional)", () => {
		const result = createProjectSchema.safeParse({ name: "Onboarding" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBeUndefined();
		}
	});

	it("rejects an empty name", () => {
		const result = createProjectSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects a name over 200 characters", () => {
		const result = createProjectSchema.safeParse({ name: "A".repeat(201) });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("accepts a name at exactly 200 characters", () => {
		const result = createProjectSchema.safeParse({ name: "A".repeat(200) });
		expect(result.success).toBe(true);
	});

	it("rejects a description over 1000 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "Valid Name",
			description: "D".repeat(1001),
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.description).toBeDefined();
	});

	it("accepts a description at exactly 1000 characters", () => {
		const result = createProjectSchema.safeParse({
			name: "Valid Name",
			description: "D".repeat(1000),
		});
		expect(result.success).toBe(true);
	});

	it("trims whitespace from name", () => {
		const result = createProjectSchema.safeParse({ name: "  Mobile App  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Mobile App");
		}
	});

	it("trims whitespace from description", () => {
		const result = createProjectSchema.safeParse({
			name: "Mobile App",
			description: "  A great project.  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.description).toBe("A great project.");
		}
	});

	it("rejects a whitespace-only name (trimmed to empty)", () => {
		const result = createProjectSchema.safeParse({ name: "   " });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("requires the name field", () => {
		const result = createProjectSchema.safeParse({});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});
});

describe("updateProjectSchema", () => {
	it("accepts updating only the name", () => {
		const result = updateProjectSchema.safeParse({ name: "New Project Name" });
		expect(result.success).toBe(true);
	});

	it("accepts updating only the description", () => {
		const result = updateProjectSchema.safeParse({ description: "Updated description." });
		expect(result.success).toBe(true);
	});

	it("accepts an empty object (no fields to update)", () => {
		const result = updateProjectSchema.safeParse({});
		expect(result.success).toBe(true);
	});

	it("accepts clearing the description with empty string", () => {
		const result = updateProjectSchema.safeParse({ description: "" });
		expect(result.success).toBe(true);
	});

	it("rejects a name that is explicitly empty string", () => {
		const result = updateProjectSchema.safeParse({ name: "" });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects a name over 200 characters", () => {
		const result = updateProjectSchema.safeParse({ name: "A".repeat(201) });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects a description over 1000 characters", () => {
		const result = updateProjectSchema.safeParse({ description: "D".repeat(1001) });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.description).toBeDefined();
	});

	it("trims whitespace from name", () => {
		const result = updateProjectSchema.safeParse({ name: "  Trimmed Name  " });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.name).toBe("Trimmed Name");
		}
	});

	it("rejects a whitespace-only name (trimmed to empty)", () => {
		const result = updateProjectSchema.safeParse({ name: "   " });
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});
});
