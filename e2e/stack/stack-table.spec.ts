/**
 * E2E: Stack table — rendering, empty state, RICE cells, sorting.
 */

import { expect, test } from "@playwright/test";
import { navigateToStack, setupTestAccount } from "./helpers";

// ── Test 1: Empty state ─────────────────────────────────────────────────────

test("empty project shows empty stack state", async ({ page }) => {
	const ctx = await setupTestAccount(page, "stack-empty");
	await navigateToStack(page, ctx.workspaceId, ctx.projectId);

	await expect(page.getByText(/No solutions to prioritise yet/i)).toBeVisible();
	await expect(page.getByText(/Add solution nodes/i)).toBeVisible();
});

// ── Test 2: Stack page renders with header ──────────────────────────────────

test("stack page shows header with stats", async ({ page }) => {
	const ctx = await setupTestAccount(page, "stack-header");
	await navigateToStack(page, ctx.workspaceId, ctx.projectId);

	await expect(page.getByText(/Priority Stack/i)).toBeVisible();
	await expect(page.getByText(/0 solutions/i)).toBeVisible();
});

// ── Test 3: Sort dropdown exists ────────────────────────────────────────────

test("sort dropdown has all sort options", async ({ page }) => {
	const ctx = await setupTestAccount(page, "stack-sort");
	await navigateToStack(page, ctx.workspaceId, ctx.projectId);

	const sortSelect = page.locator("select").first();
	await expect(sortSelect).toBeVisible();

	// Verify options exist
	const options = sortSelect.locator("option");
	const count = await options.count();
	expect(count).toBeGreaterThanOrEqual(7);
});

// ── Test 4: Sync button visible for editors ─────────────────────────────────

test("sync button is visible for users with write permission", async ({ page }) => {
	const ctx = await setupTestAccount(page, "stack-sync");
	await navigateToStack(page, ctx.workspaceId, ctx.projectId);

	const syncButton = page.getByRole("button", { name: /Sync/i });
	await expect(syncButton).toBeVisible();
});

// ── Test 5: Auth redirect ───────────────────────────────────────────────────

test("unauthenticated user is redirected to login", async ({ page }) => {
	await page.goto("/some-workspace/some-project/stack");
	await page.waitForURL("**/login**");
	expect(page.url()).toContain("/login");
});
