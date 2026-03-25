/**
 * E2E: Engine list — search, filter, sort, pagination, empty states.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Empty state ─────────────────────────────────────────────────────

test("empty project shows 'No insights yet' state with CTAs", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-empty");
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	await expect(page.getByText(/No insights yet/i)).toBeVisible();
	// Should show "Analyse a note" or "Create insight manually" CTAs
	await expect(
		page.getByRole("button", { name: /Analyse a note|Create insight manually/i }).first(),
	).toBeVisible();
});

// ── Test 2: Create manual insight appears in list ───────────────────────────

test("manual insight creation adds card to list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create");

	// First create a note so the project has content
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Engine Test User",
		content: "User reported frustration with the checkout process.",
	});

	// Create a manual insight
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Users find checkout confusing",
		themeTag: "checkout",
	});

	// Refresh engine page and verify the insight appears
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Users find checkout confusing")).toBeVisible();
});

// ── Test 3: Search filters insights ─────────────────────────────────────────

test("search by statement text filters results", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-search");

	// Create notes first (engine needs at least one insight to show search)
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Searcher",
		content: "Research data.",
	});

	// Create two insights with different statements
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Users abandon onboarding at step three",
		themeTag: "onboarding",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Mobile users prefer dark mode in settings",
		themeTag: "UX",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Search for "onboarding"
	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("onboarding");
	await page.waitForTimeout(400); // debounce

	await expect(page.getByText("Users abandon onboarding at step three")).toBeVisible();
	await expect(page.getByText("Mobile users prefer dark mode in settings")).not.toBeVisible();

	// Clear search → both return
	await searchInput.clear();
	await page.waitForTimeout(400);
	await expect(page.getByText("Mobile users prefer dark mode in settings")).toBeVisible();
});

// ── Test 4: No-results state ────────────────────────────────────────────────

test("no results state shows clear filters option", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-no-results");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "No Results User",
		content: "Some notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Users struggle with navigation",
		themeTag: "navigation",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Search for something that doesn't exist
	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("zzzznonexistentzzzz");
	await page.waitForTimeout(400);

	await expect(page.getByText(/No insights match/i)).toBeVisible();
	await expect(page.getByText(/Clear all filters/i)).toBeVisible();

	// Click clear → insight returns
	await page.getByText(/Clear all filters/i).click();
	await page.waitForTimeout(400);
	await expect(page.getByText("Users struggle with navigation")).toBeVisible();
});

// ── Test 5: Header shows count and connected count ──────────────────────────

test("header shows total count and connected count", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-header-count");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Counter",
		content: "Count test notes.",
	});

	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Insight one for counting",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Insight two for counting",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Header should show "2 insights · 0 connected"
	await expect(page.getByText(/2 insights/i)).toBeVisible();
	await expect(page.getByText(/0 connected/i)).toBeVisible();
});
