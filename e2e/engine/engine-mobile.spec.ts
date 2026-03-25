/**
 * E2E: Engine mobile layout — responsive design, touch interactions.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

test.use({
	viewport: { width: 390, height: 844 }, // iPhone 14 Pro
});

// ── Test 1: Mobile layout renders correctly ─────────────────────────────────

test("engine list renders on mobile viewport", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-mobile-render");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Mobile Tester",
		content: "Notes for mobile layout test.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Mobile insight for responsive test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Page title visible
	await expect(page.getByText(/Insight Engine/i)).toBeVisible();

	// Insight card visible
	await expect(page.getByText("Mobile insight for responsive test")).toBeVisible();

	// No horizontal scroll
	const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
	const clientWidth = await page.evaluate(() => document.body.clientWidth);
	expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // 1px tolerance
});

// ── Test 2: Search works on mobile ──────────────────────────────────────────

test("search input is functional on mobile", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-mobile-search");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Mobile Search",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Mobile searchable insight alpha",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Mobile searchable insight beta",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("alpha");
	await page.waitForTimeout(400);

	await expect(page.getByText("Mobile searchable insight alpha")).toBeVisible();
	await expect(page.getByText("Mobile searchable insight beta")).not.toBeVisible();
});

// ── Test 3: Create insight works on mobile ──────────────────────────────────

test("create insight slide-over works on mobile viewport", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-mobile-create");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Mobile Creator",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Existing mobile insight",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await page.getByRole("button", { name: /Create Insight/i }).click();

	// Slide-over should be full-width on mobile
	const dialog = page.locator("dialog[aria-label='Create Insight']");
	await expect(dialog).toBeVisible();

	// Fill and submit
	await page.locator("#insight-statement").fill("Mobile-created insight");
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();
	await page.waitForTimeout(1_500);

	// Should close and show the new insight
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Mobile-created insight")).toBeVisible();
});

// ── Test 4: Empty state is usable on mobile ─────────────────────────────────

test("empty state CTAs are accessible on mobile", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-mobile-empty");
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Empty state visible
	await expect(page.getByText(/No insights yet/i)).toBeVisible();

	// CTAs should be visible and not clipped
	const cta = page.getByRole("button", { name: /Analyse a note|Create insight manually/i }).first();
	await expect(cta).toBeVisible();
	await expect(cta).toBeInViewport();
});
