import { checkRateLimit } from "@/lib/auth/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { describe, expect, it } from "vitest";

describe("Login Validation", () => {
	it("validates valid credentials", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "anypassword",
		});
		expect(result.success).toBe(true);
	});

	it("rejects invalid email", () => {
		const result = loginSchema.safeParse({
			email: "not-email",
			password: "anypassword",
		});
		expect(result.success).toBe(false);
	});

	it("rejects empty password", () => {
		const result = loginSchema.safeParse({
			email: "user@example.com",
			password: "",
		});
		expect(result.success).toBe(false);
	});

	it("lowercases email", () => {
		const result = loginSchema.safeParse({
			email: "USER@EXAMPLE.COM",
			password: "password",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.email).toBe("user@example.com");
		}
	});
});

describe("Rate limiter — login", () => {
	it("rate limits after maxAttempts", () => {
		const key = `login-test-${Date.now()}`;
		for (let i = 0; i < 5; i++) {
			checkRateLimit(key, { maxAttempts: 5, windowMs: 60_000 });
		}
		const result = checkRateLimit(key, { maxAttempts: 5, windowMs: 60_000 });
		expect(result.allowed).toBe(false);
	});
});
