import { checkRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema, signupSchema } from "@/lib/validations/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Test the validation schemas directly (no DB needed)
describe("Signup Validation", () => {
	it("validates a valid signup input", () => {
		const result = signupSchema.safeParse({
			name: "Test User",
			email: "test@example.com",
			password: "Password1",
		});
		expect(result.success).toBe(true);
	});

	it("rejects missing name", () => {
		const result = signupSchema.safeParse({
			name: "",
			email: "test@example.com",
			password: "Password1",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.name).toBeDefined();
	});

	it("rejects invalid email", () => {
		const result = signupSchema.safeParse({
			name: "Test",
			email: "not-an-email",
			password: "Password1",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.email).toBeDefined();
	});

	it("rejects password without uppercase", () => {
		const result = signupSchema.safeParse({
			name: "Test",
			email: "test@example.com",
			password: "password1",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.password).toBeDefined();
	});

	it("rejects password without number", () => {
		const result = signupSchema.safeParse({
			name: "Test",
			email: "test@example.com",
			password: "PasswordOnly",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.password).toBeDefined();
	});

	it("rejects password under 8 characters", () => {
		const result = signupSchema.safeParse({
			name: "Test",
			email: "test@example.com",
			password: "Pass1",
		});
		expect(result.success).toBe(false);
		expect(result.error?.flatten().fieldErrors.password).toBeDefined();
	});

	it("lowercases email", () => {
		const result = signupSchema.safeParse({
			name: "Test",
			email: "TEST@EXAMPLE.COM",
			password: "Password1",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("test@example.com");
		}
	});
});

describe("Rate Limiter", () => {
	it("allows requests within limit", () => {
		const key = `test-${Date.now()}`;
		const result = checkRateLimit(key, { maxAttempts: 3, windowMs: 60_000 });
		expect(result.allowed).toBe(true);
	});

	it("blocks requests over limit", () => {
		const key = `test-block-${Date.now()}`;
		checkRateLimit(key, { maxAttempts: 2, windowMs: 60_000 });
		checkRateLimit(key, { maxAttempts: 2, windowMs: 60_000 });
		const result = checkRateLimit(key, { maxAttempts: 2, windowMs: 60_000 });
		expect(result.allowed).toBe(false);
	});
});
