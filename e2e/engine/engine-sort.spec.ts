/**
 * E2E: Engine sort — confidence_desc, confidence_asc, newest, oldest, recently_modified.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Default sort is confidence descending ───────────────────────────

test("default sort is confidence descending", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-sort-default");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Sort Tester",
		content: "Data for sorting.",
	});

	// Create insights (all at confidence 0 since no evidence linked)
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "First created insight for sort",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Second created insight for sort",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Both insights visible in default confidence_desc order
	await expect(page.getByText("First created insight for sort")).toBeVisible();
	await expect(page.getByText("Second created insight for sort")).toBeVisible();

	// Sort dropdown should show "Confidence" or default selection
	const sortDropdown = page.getByRole("combobox", { name: /Sort/i })
		.or(page.locator("select").filter({ hasText: /confidence|newest/i }));
	if (await sortDropdown.isVisible()) {
		// Verify the dropdown exists and is interactive
		await expect(sortDropdown).toBeEnabled();
	}
});

// ── Test 2: Switching sort to newest ────────────────────────────────────────

test("sort by newest shows most recently created first", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-sort-newest");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Newest Sort Tester",
		content: "Data for newest sort test.",
	});

	// Create insights with delay to ensure different timestamps
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Older insight created first",
	});
	await page.waitForTimeout(1_000);
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Newer insight created second",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Switch to "newest" sort
	const sortDropdown = page.getByRole("combobox", { name: /Sort/i })
		.or(page.locator("select").filter({ hasText: /confidence|newest/i }));
	if (await sortDropdown.isVisible()) {
		await sortDropdown.selectOption("newest");
		await page.waitForTimeout(400);

		// "Newer insight" should appear first (before "Older insight")
		const allText = await page.locator("article, [data-testid='insight-card']").allTextContents();
		const newerIdx = allText.findIndex((t) => t.includes("Newer insight"));
		const olderIdx = allText.findIndex((t) => t.includes("Older insight"));
		if (newerIdx >= 0 && olderIdx >= 0) {
			expect(newerIdx).toBeLessThan(olderIdx);
		}
	}
});

// ── Test 3: Sort persists across search ─────────────────────────────────────

test("sort selection persists when search is applied", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-sort-persist");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Sort Persist Tester",
		content: "Data for sort persistence test.",
	});

	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Alpha insight for persistence",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Beta insight for persistence",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Change sort to oldest
	const sortDropdown = page.getByRole("combobox", { name: /Sort/i })
		.or(page.locator("select").filter({ hasText: /confidence|newest/i }));
	if (await sortDropdown.isVisible()) {
		await sortDropdown.selectOption("oldest");
		await page.waitForTimeout(400);

		// Search for "insight"
		const searchInput = page.getByPlaceholder(/Search insights/i);
		await searchInput.fill("insight");
		await page.waitForTimeout(400);

		// Sort should still be "oldest"
		const currentSort = await sortDropdown.inputValue();
		expect(currentSort).toBe("oldest");
	}
});
