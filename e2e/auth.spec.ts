import { test, expect } from "@playwright/test";

test.describe("Auth", () => {
	test("login page renders correctly", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByRole("heading", { level: 1 })).toContainText("discova");
		await expect(page.getByLabel("EMAIL")).toBeVisible();
		await expect(page.getByLabel("PASSWORD")).toBeVisible();
		await expect(page.getByRole("button", { name: /Continue with Google/i })).toBeVisible();
		await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
	});

	test("signup page renders correctly", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.getByLabel("NAME")).toBeVisible();
		await expect(page.getByLabel("EMAIL")).toBeVisible();
		await expect(page.getByLabel("PASSWORD")).toBeVisible();
		await expect(page.getByRole("button", { name: /Create account/i })).toBeVisible();
	});

	test("login form shows validation errors for empty submit", async ({ page }) => {
		await page.goto("/login");
		// The HTML form `required` attribute prevents submission, so this tests
		// that inputs are required
		const emailInput = page.getByLabel("EMAIL");
		await expect(emailInput).toHaveAttribute("required");
	});

	test("protected route redirects to login", async ({ page }) => {
		await page.goto("/onboarding");
		await expect(page).toHaveURL(/\/login/);
	});

	test("login page has link to signup", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByRole("link", { name: /Create one/i })).toBeVisible();
	});

	test("signup page has link to login", async ({ page }) => {
		await page.goto("/signup");
		await expect(page.getByRole("link", { name: /Sign in/i })).toBeVisible();
	});
});
