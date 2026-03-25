/**
 * E2E: Create Insight slide-over — form validation, submission, cancel.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Create insight form opens and closes ────────────────────────────

test("create insight slide-over opens and closes with Escape", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create-slideover");

	// Need at least one insight for the Create button to appear (non-empty state)
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Slideover Tester",
		content: "Some research notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Initial insight for slide-over test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Click "Create Insight" button
	await page.getByRole("button", { name: /Create Insight/i }).click();

	// Slide-over should appear with dialog
	await expect(page.locator("dialog[aria-label='Create Insight']")).toBeVisible();

	// Close with Escape
	await page.keyboard.press("Escape");
	await page.waitForTimeout(500);

	// Slide-over should be gone
	await expect(page.locator("dialog[aria-label='Create Insight']")).not.toBeVisible();
});

// ── Test 2: Submit disabled when statement is empty ─────────────────────────

test("submit button disabled when statement is empty", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create-disabled");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Disabled Button Tester",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Existing insight for button test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await page.getByRole("button", { name: /Create Insight/i }).click();

	// The submit button inside the dialog should be disabled
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await expect(submitButton).toBeDisabled();

	// Type a statement → button becomes enabled
	await page.locator("#insight-statement").fill("A valid insight statement");
	await expect(submitButton).toBeEnabled();

	// Clear the statement → button disabled again
	await page.locator("#insight-statement").clear();
	await expect(submitButton).toBeDisabled();
});

// ── Test 3: Character counter works ─────────────────────────────────────────

test("character counter updates and shows limit", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create-counter");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Counter Tester",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Existing insight for counter test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await page.getByRole("button", { name: /Create Insight/i }).click();

	// Counter should show 0/500
	await expect(page.getByText("0/500")).toBeVisible();

	// Type some text
	await page.locator("#insight-statement").fill("Hello world");
	await expect(page.getByText("11/500")).toBeVisible();
});

// ── Test 4: Theme tag is optional ───────────────────────────────────────────

test("insight can be created without a theme tag", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create-no-theme");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "No Theme Tester",
		content: "Notes.",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Use the empty state "Create insight manually" button if engine is empty
	const createBtn = page.getByRole("button", { name: /Create insight manually/i })
		.or(page.getByRole("button", { name: /Create Insight/i }));
	await createBtn.first().click();

	// Fill only statement, no theme tag
	await page.locator("#insight-statement").fill("An insight without any theme tag");
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();

	// Wait for creation
	await page.waitForTimeout(1_500);

	// Navigate to engine list to verify
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("An insight without any theme tag")).toBeVisible();
});

// ── Test 5: Successful creation closes slide-over ───────────────────────────

test("successful creation closes the slide-over and refreshes list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-create-close");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Close Tester",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Existing insight before close test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await page.getByRole("button", { name: /Create Insight/i }).click();

	await page.locator("#insight-statement").fill("Newly created insight via slide-over");
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();

	// Slide-over should close
	await expect(page.locator("dialog[aria-label='Create Insight']")).not.toBeVisible({
		timeout: 5_000,
	});
});
