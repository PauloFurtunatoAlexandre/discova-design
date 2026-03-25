/**
 * Shared helpers for Vault E2E tests.
 *
 * Each test should create its own user to avoid test pollution.
 * Email format: `vault-test-{testName}-{timestamp}@test.discova.dev`
 */

import type { Page } from "@playwright/test";

export interface TestContext {
	email: string;
	password: string;
	workspaceId: string;
	projectId: string;
}

/**
 * Signs up a fresh user, completes onboarding (workspace + project),
 * and returns their credentials + IDs.
 */
export async function setupTestAccount(
	page: Page,
	label = "user",
): Promise<TestContext> {
	const ts = Date.now();
	const email = `vault-test-${label}-${ts}@test.discova.dev`;
	const password = "TestPass1!";

	// ── Signup ────────────────────────────────────────────────────────────────
	await page.goto("/signup");
	await page.getByLabel("NAME").fill("Test User");
	await page.getByLabel("EMAIL").fill(email);
	await page.getByLabel("PASSWORD").fill(password);
	await page.getByRole("button", { name: /Create account/i }).click();

	// ── Onboarding — workspace step ───────────────────────────────────────────
	await page.waitForURL("**/onboarding**");
	await page.getByLabel("WORKSPACE NAME").fill(`WS-${ts}`);
	await page.getByRole("button", { name: "Continue" }).click();

	// ── Onboarding — project step ─────────────────────────────────────────────
	await page.getByLabel("PROJECT NAME").fill(`Project-${ts}`);
	await page.getByRole("button", { name: "Create project" }).click();

	// ── Onboarding — done step ────────────────────────────────────────────────
	await page.getByRole("button", { name: "Open Discova" }).click();

	// ── Extract workspaceId from URL ──────────────────────────────────────────
	await page.waitForURL((url) => !url.href.includes("/onboarding"));
	const workspaceId = new URL(page.url()).pathname.split("/").filter(Boolean)[0] ?? "";

	// ── Navigate to the first project to extract projectId ───────────────────
	// The sidebar renders links as /{workspaceId}/{projectId}
	const projectLink = page.locator(`a[href^="/${workspaceId}/"]`).first();
	await projectLink.waitFor({ timeout: 10_000 });
	await projectLink.click();
	await page.waitForURL(`**/${workspaceId}/**`);
	const projectId =
		new URL(page.url()).pathname.split("/").filter(Boolean)[1] ?? "";

	return { email, password, workspaceId, projectId };
}

/**
 * Logs in with email + password via the login form.
 * Waits until the login redirects away from /login.
 */
export async function loginAs(
	page: Page,
	email: string,
	password: string,
): Promise<void> {
	await page.goto("/login");
	await page.getByLabel("EMAIL").fill(email);
	await page.getByLabel("PASSWORD").fill(password);
	await page.getByRole("button", { name: /Sign in/i }).click();
	await page.waitForURL((url) => !url.href.includes("/login"), {
		timeout: 15_000,
	});
}

/**
 * Navigates to the Vault list page for the given project.
 */
export async function navigateToVault(
	page: Page,
	workspaceId: string,
	projectId: string,
): Promise<void> {
	await page.goto(`/${workspaceId}/${projectId}/vault`);
	await page.waitForLoadState("networkidle");
}

/**
 * Runs through the note creation wizard and waits for redirect to the note doc view.
 * Returns the noteId extracted from the final URL.
 */
export async function createNote(
	page: Page,
	workspaceId: string,
	projectId: string,
	opts: { participant: string; content: string },
): Promise<string> {
	await page.goto(`/${workspaceId}/${projectId}/vault/new`);

	// Step 1: participant
	const participantInput = page.getByPlaceholder(/participant|interview|source/i).first();
	await participantInput.fill(opts.participant);
	await page.getByRole("button", { name: "Next" }).click();

	// Step 2: date — accept default (today)
	await page.getByRole("button", { name: "Next" }).click();

	// Step 3: content
	const contentArea = page.getByPlaceholder(/Paste your interview notes/i);
	await contentArea.fill(opts.content);
	await page.getByRole("button", { name: /Create Note/i }).click();

	// Wait for redirect to note document view
	await page.waitForURL(
		(url) => url.href.includes(`/${workspaceId}/${projectId}/vault/`) && !url.href.endsWith("/new"),
		{ timeout: 15_000 },
	);

	return new URL(page.url()).pathname.split("/").pop() ?? "";
}
