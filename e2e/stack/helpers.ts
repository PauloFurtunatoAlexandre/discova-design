/**
 * Shared helpers for Stack E2E tests.
 *
 * Re-exports vault/engine/map helpers and adds stack-specific helpers.
 */

import type { Page } from "@playwright/test";

// ── Re-export shared helpers ──────────────────────────────────────────────────

export {
	loginAs,
	setupTestAccount,
	type TestContext,
} from "../vault/helpers";
export { createMapNode, navigateToMap } from "../map/helpers";
import { navigateToMap } from "../map/helpers";

// ── Stack-specific helpers ──────────────────────────────────────────────────

/**
 * Navigates to the Stack page for the given project.
 */
export async function navigateToStack(
	page: Page,
	workspaceId: string,
	projectId: string,
): Promise<void> {
	await page.goto(`/${workspaceId}/${projectId}/stack`);
	await page.waitForLoadState("networkidle");
}

/**
 * Creates a solution node on the map so it syncs to the stack.
 */
export async function createSolutionForStack(
	page: Page,
	workspaceId: string,
	projectId: string,
	label: string,
): Promise<void> {
	await navigateToMap(page, workspaceId, projectId);

	const fabButton = page.getByTestId("map-fab");
	await fabButton.click();

	await page.getByRole("button", { name: /Solution/i }).click();

	const labelInput = page.locator("#node-label");
	await labelInput.waitFor({ state: "visible", timeout: 5_000 });
	await labelInput.fill(label);

	await page.getByRole("button", { name: /^Create$/i }).click();
	await page.waitForTimeout(1_500);
}
