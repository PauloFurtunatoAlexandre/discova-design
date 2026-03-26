/**
 * Shared helpers for Map E2E tests.
 *
 * Re-exports vault/engine helpers and adds map-specific helpers
 * for navigating to the map, creating nodes, etc.
 *
 * Email format: `map-test-{testName}-{timestamp}@test.discova.dev`
 */

import type { Page } from "@playwright/test";

// ── Re-export shared helpers ──────────────────────────────────────────────────

export {
	loginAs,
	setupTestAccount,
	type TestContext,
} from "../vault/helpers";
export { createNote } from "../vault/helpers";
export { createManualInsight, navigateToEngine } from "../engine/helpers";

// ── Map-specific helpers ──────────────────────────────────────────────────────

/**
 * Navigates to the Map page for the given project.
 */
export async function navigateToMap(
	page: Page,
	workspaceId: string,
	projectId: string,
): Promise<void> {
	await page.goto(`/${workspaceId}/${projectId}/map`);
	await page.waitForLoadState("networkidle");
}

/**
 * Creates a Problem or Solution node via the FAB button and slide-over.
 */
export async function createMapNode(
	page: Page,
	workspaceId: string,
	projectId: string,
	opts: {
		type: "problem" | "solution";
		label: string;
		description?: string;
	},
): Promise<void> {
	await navigateToMap(page, workspaceId, projectId);

	// Open the FAB menu
	const fabButton = page.getByTestId("map-fab");
	await fabButton.click();

	// Click the appropriate type button
	const typeLabel = opts.type === "problem" ? /Problem/i : /Solution/i;
	await page.getByRole("button", { name: typeLabel }).click();

	// Fill the label
	const labelInput = page.locator("#node-label");
	await labelInput.waitFor({ state: "visible", timeout: 5_000 });
	await labelInput.fill(opts.label);

	// Fill description if provided
	if (opts.description) {
		await page.locator("#node-description").fill(opts.description);
	}

	// Submit the form
	await page.getByRole("button", { name: /^Create$/i }).click();

	// Wait for the slide-over to close
	await page.waitForTimeout(1_500);
}

/**
 * Returns the number of visible map nodes on the canvas.
 */
export async function getMapNodeCount(page: Page): Promise<number> {
	await page.waitForLoadState("networkidle");
	const nodes = page.locator("[data-testid='map-node']");
	return nodes.count();
}

/**
 * Clicks a map node by its label text to select it.
 */
export async function selectMapNode(page: Page, label: string): Promise<void> {
	const node = page.getByText(label).first();
	await node.click();
}
