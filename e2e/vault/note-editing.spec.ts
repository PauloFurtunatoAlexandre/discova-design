/**
 * E2E: Note document view — editing content, metadata, auto-save, and delete.
 */

import { expect, test } from "@playwright/test";
import { createNote, navigateToVault, setupTestAccount } from "./helpers";

// ── Test 1: Edit content + auto-save ─────────────────────────────────────────

test("edit content auto-saves and persists across reload", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-content");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Test User",
		content: "Initial note content here.",
	});

	// Click inside editor and type additional text
	const editor = page.locator(".note-editor-content");
	await editor.click();
	await editor.press("End");
	await page.keyboard.type(" Additional content added.");

	// Wait for auto-save to complete (debounce ~2s + save time)
	await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 6_000 });

	// Reload — content persists
	await page.reload();
	await expect(page.getByText("Additional content added.")).toBeVisible({ timeout: 5_000 });
});

// ── Test 2: Edit metadata on blur ─────────────────────────────────────────────

test("research method saved on blur and persists across reload", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-metadata");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Meta User",
		content: "Some research notes.",
	});

	// Change research method
	await page.selectOption("select#meta-panel-method, [id='meta-panel-method']", "survey");
	// Trigger blur by clicking elsewhere
	await page.locator(".note-editor-content").click();

	// Reload — method persists
	await page.reload();
	await page.waitForLoadState("networkidle");

	const methodSelect = page.locator("#meta-panel-method");
	await expect(methodSelect).toHaveValue("survey");
});

// ── Test 3: Follow-up toggle ──────────────────────────────────────────────────

test("follow-up toggle reflects in vault list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-followup");
	const participant = "Follow User";

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant,
		content: "Research notes.",
	});

	// Toggle follow-up to ON
	const toggle = page.getByRole("switch", { name: /Follow.?up/i });
	await toggle.click();
	await expect(toggle).toHaveAttribute("aria-checked", "true");

	// Navigate to list — follow-up flag shows on card
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Follow-up")).toBeVisible();

	// Return and toggle OFF
	await page.locator("article, [role='article'], button").filter({ hasText: participant }).click();
	await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`);

	const toggleOff = page.getByRole("switch", { name: /Follow.?up/i });
	await toggleOff.click();
	await expect(toggleOff).toHaveAttribute("aria-checked", "false");

	// Back to list — flag gone
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Follow-up")).not.toBeVisible();
});

// ── Test 4: Editor formatting persists ───────────────────────────────────────

test("bold formatting persists after auto-save and reload", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-format");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Format User",
		content: "Plain text to format.",
	});

	// Select text in editor
	const editor = page.locator(".note-editor-content");
	await editor.click();

	// Triple-click to select all paragraph text
	await editor.locator("p").first().click({ clickCount: 3 });

	// Click Bold toolbar button (or use keyboard shortcut)
	await page.keyboard.press("Control+b");

	// Wait for auto-save
	await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 6_000 });

	// Reload — bold formatting present
	await page.reload();
	await page.waitForLoadState("networkidle");

	const boldText = editor.locator("strong");
	await expect(boldText).toBeVisible({ timeout: 5_000 });
});

// ── Test 5: Metadata panel collapse ──────────────────────────────────────────

test("metadata panel collapse state persists across reload", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-panel");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Panel User",
		content: "Notes here.",
	});

	// Panel should start open on desktop
	await expect(page.locator("#meta-panel-method")).toBeVisible();

	// Click collapse toggle
	await page.getByRole("button", { name: /collapse|chevron/i }).click();

	// Panel collapses — metadata no longer visible
	await expect(page.locator("#meta-panel-method")).not.toBeVisible();

	// Reload — panel still collapsed (localStorage persistence)
	await page.reload();
	await page.waitForLoadState("networkidle");
	await expect(page.locator("#meta-panel-method")).not.toBeVisible();

	// Expand again — panel reopens
	await page.getByRole("button", { name: /expand|chevron/i }).click();
	await expect(page.locator("#meta-panel-method")).toBeVisible();
});

// ── Test 6: Delete note ───────────────────────────────────────────────────────

test("delete note redirects to vault list and removes card", async ({ page }) => {
	const ctx = await setupTestAccount(page, "editing-delete");
	const participant = "Delete User";

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant,
		content: "This note will be deleted.",
	});

	// Find and click delete option — look for "More" / kebab menu or delete button
	const moreBtn = page.getByRole("button", { name: /more|⋯|delete/i }).first();
	await moreBtn.click();

	const deleteOption = page.getByRole("menuitem", { name: /delete/i });
	await deleteOption.click();

	// Confirm deletion in dialog
	await page.getByRole("button", { name: /confirm|delete|yes/i }).click();

	// Redirected to vault list
	await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault`, { timeout: 10_000 });

	// Note no longer in list
	await expect(page.getByText(participant)).not.toBeVisible();
});
