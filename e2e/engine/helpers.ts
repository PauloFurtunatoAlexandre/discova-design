/**
 * Shared helpers for Engine E2E tests.
 *
 * Re-exports vault helpers (signup, login) and adds engine-specific helpers
 * for creating insights, navigating to the engine page, etc.
 *
 * Email format: `engine-test-{testName}-{timestamp}@test.discova.dev`
 */

import type { Page } from "@playwright/test";

// ── Re-export shared helpers ──────────────────────────────────────────────────

export {
	loginAs,
	setupTestAccount,
	type TestContext,
} from "../vault/helpers";
export { createNote } from "../vault/helpers";

// ── Engine-specific helpers ───────────────────────────────────────────────────

/**
 * Navigates to the Engine list page for the given project.
 */
export async function navigateToEngine(
	page: Page,
	workspaceId: string,
	projectId: string,
): Promise<void> {
	await page.goto(`/${workspaceId}/${projectId}/engine`);
	await page.waitForLoadState("networkidle");
}

/**
 * Opens the "Create Insight" slide-over and fills in the form.
 * Returns the new insight ID extracted from the page after creation.
 */
export async function createManualInsight(
	page: Page,
	workspaceId: string,
	projectId: string,
	opts: {
		statement: string;
		themeTag?: string;
	},
): Promise<void> {
	await navigateToEngine(page, workspaceId, projectId);

	// Click "Create Insight" button
	await page.getByRole("button", { name: /Create Insight/i }).click();

	// Fill the statement
	const statementInput = page.locator("#insight-statement");
	await statementInput.waitFor({ state: "visible", timeout: 5_000 });
	await statementInput.fill(opts.statement);

	// Fill the theme tag if provided
	if (opts.themeTag) {
		await page.locator("#theme-tag").fill(opts.themeTag);
	}

	// Submit the form
	await page.getByRole("button", { name: /^Create Insight$/i }).click();

	// Wait for the slide-over to close (form disappears)
	await page.waitForTimeout(1_500);
}

/**
 * Waits for the insight list to load and returns the number of visible insight cards.
 */
export async function getInsightCardCount(page: Page): Promise<number> {
	await page.waitForLoadState("networkidle");
	// Insight cards are rendered inside the list; they use InsightCard component
	const cards = page.locator("[data-testid='insight-card'], article");
	return cards.count();
}
