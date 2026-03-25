/**
 * E2E: Engine pagination — cursor-based load more, no duplicates.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Load more button appends next page ──────────────────────────────

test("load more button appends next page without duplicates", async ({ page }) => {
	test.slow(); // Creating 25 insights takes time

	const ctx = await setupTestAccount(page, "engine-pagination");

	// Create a note (needed for non-empty engine)
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Pagination User",
		content: "Content for pagination test.",
	});

	// Create 25 insights to exceed the default limit of 20
	for (let i = 1; i <= 25; i++) {
		await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
			statement: `Pagination insight number ${i.toString().padStart(2, "0")}`,
		});
	}

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Should see "Load more" button (default limit=20)
	await expect(page.getByRole("button", { name: /Load more/i })).toBeVisible({ timeout: 10_000 });

	// Click "Load more"
	await page.getByRole("button", { name: /Load more/i }).click();
	await page.waitForTimeout(2_000);

	// "Load more" should disappear (25 total, all loaded)
	await expect(page.getByRole("button", { name: /Load more/i })).not.toBeVisible();

	// Verify all 25 insights are visible
	for (let i = 1; i <= 25; i++) {
		await expect(
			page.getByText(`Pagination insight number ${i.toString().padStart(2, "0")}`),
		).toBeVisible();
	}
});

// ── Test 2: Pagination resets on filter change ──────────────────────────────

test("changing a filter resets pagination to first page", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-pagination-reset");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Pagination Reset",
		content: "Content.",
	});

	// Create insights with different themes
	for (let i = 1; i <= 3; i++) {
		await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
			statement: `Alpha insight ${i}`,
			themeTag: "alpha",
		});
	}
	for (let i = 1; i <= 2; i++) {
		await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
			statement: `Beta insight ${i}`,
			themeTag: "beta",
		});
	}

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// All 5 should be visible
	await expect(page.getByText("Alpha insight 1")).toBeVisible();
	await expect(page.getByText("Beta insight 1")).toBeVisible();

	// Search for "Alpha" → only 3 results, no Load more
	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("Alpha");
	await page.waitForTimeout(400);

	await expect(page.getByText("Alpha insight 1")).toBeVisible();
	await expect(page.getByText("Beta insight 1")).not.toBeVisible();
	await expect(page.getByRole("button", { name: /Load more/i })).not.toBeVisible();
});
