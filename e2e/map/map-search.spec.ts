/**
 * E2E: Map search overlay — open/close, keyboard navigation, filtering.
 */

import { expect, test } from "@playwright/test";
import { createMapNode, navigateToMap, setupTestAccount } from "./helpers";

// ── Test 1: Cmd+K opens search ──────────────────────────────────────────────

test("Cmd+K opens the search overlay", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-search-open");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Searchable node",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await page.keyboard.press("Meta+k");

	const searchInput = page.getByPlaceholder(/Search nodes/i);
	await expect(searchInput).toBeVisible();
});

// ── Test 2: Escape closes search ────────────────────────────────────────────

test("Escape closes the search overlay", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-search-close");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Another searchable node",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await page.keyboard.press("Meta+k");

	const searchInput = page.getByPlaceholder(/Search nodes/i);
	await expect(searchInput).toBeVisible();

	await page.keyboard.press("Escape");
	await expect(searchInput).not.toBeVisible();
});

// ── Test 3: Search filters nodes ────────────────────────────────────────────

test("typing in search filters the node list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-search-filter");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Checkout flow issue",
	});
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "solution",
		label: "Onboarding wizard improvement",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await page.keyboard.press("Meta+k");

	const searchInput = page.getByPlaceholder(/Search nodes/i);
	await searchInput.fill("Checkout");

	// Should show the matching node
	await expect(page.getByText("Checkout flow issue")).toBeVisible();
	// Should not show the non-matching node in the search results
	const results = page.locator("[class*='max-h-80'] button");
	const count = await results.count();
	expect(count).toBe(1);
});

// ── Test 4: Enter selects node from search ──────────────────────────────────

test("pressing Enter selects the highlighted search result", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-search-select");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Selectable via search",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await page.keyboard.press("Meta+k");

	const searchInput = page.getByPlaceholder(/Search nodes/i);
	await searchInput.fill("Selectable");
	await page.keyboard.press("Enter");

	// Search should close
	await expect(searchInput).not.toBeVisible();

	// The node should now be selected on the canvas
	const node = page.locator("[data-testid='map-node']").first();
	await expect(node).toHaveAttribute("aria-selected", "true");
});
