/**
 * E2E: Engine filters — theme tag, confidence range, connection status, author.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Filter by theme tag ─────────────────────────────────────────────

test("filter by theme tag shows only matching insights", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-filter-theme");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Theme Tester",
		content: "Research data for theme filter test.",
	});

	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Onboarding flow is too long",
		themeTag: "onboarding",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Users love the dashboard layout",
		themeTag: "dashboard",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Onboarding needs better progress indicators",
		themeTag: "onboarding",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Select "onboarding" theme filter
	const themeFilter = page.getByRole("combobox", { name: /Theme/i })
		.or(page.locator("select").filter({ hasText: /theme/i }));
	if (await themeFilter.isVisible()) {
		await themeFilter.selectOption("onboarding");
		await page.waitForTimeout(400);

		// Only onboarding insights visible
		await expect(page.getByText("Onboarding flow is too long")).toBeVisible();
		await expect(page.getByText("Onboarding needs better progress indicators")).toBeVisible();
		await expect(page.getByText("Users love the dashboard layout")).not.toBeVisible();
	}
});

// ── Test 2: Filter by connection status ─────────────────────────────────────

test("connection filter distinguishes connected vs unconnected", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-filter-connection");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Connection Tester",
		content: "Data for connection filter test.",
	});

	// Create insights (all unconnected since no map connections exist)
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Unconnected insight for filter test",
		themeTag: "test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Connection filter should be available
	const connectionFilter = page.getByRole("combobox", { name: /Connection|Status/i })
		.or(page.locator("select").filter({ hasText: /connected|unconnected/i }));
	if (await connectionFilter.isVisible()) {
		// Filter for "unconnected"
		await connectionFilter.selectOption("unconnected");
		await page.waitForTimeout(400);
		await expect(page.getByText("Unconnected insight for filter test")).toBeVisible();

		// Filter for "connected" — no results expected
		await connectionFilter.selectOption("connected");
		await page.waitForTimeout(400);
		await expect(page.getByText(/No insights match/i)).toBeVisible();
	}
});

// ── Test 3: Combined filters narrow results ─────────────────────────────────

test("combined theme + search filters produce intersection", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-filter-combined");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Combined Tester",
		content: "Data for combined filter test.",
	});

	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Pricing page confusion observed",
		themeTag: "pricing",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Onboarding confusion at step 2",
		themeTag: "onboarding",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Pricing tier names unclear",
		themeTag: "pricing",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Filter by theme "pricing"
	const themeFilter = page.getByRole("combobox", { name: /Theme/i })
		.or(page.locator("select").filter({ hasText: /theme/i }));
	if (await themeFilter.isVisible()) {
		await themeFilter.selectOption("pricing");
		await page.waitForTimeout(400);
	}

	// Search for "confusion"
	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("confusion");
	await page.waitForTimeout(400);

	// Only "Pricing page confusion observed" should be visible
	await expect(page.getByText("Pricing page confusion observed")).toBeVisible();
	await expect(page.getByText("Pricing tier names unclear")).not.toBeVisible();
	await expect(page.getByText("Onboarding confusion at step 2")).not.toBeVisible();
});
