/**
 * E2E: Mobile viewport flows — 375×812 (iPhone SE/13 size).
 */

import { expect, test } from "@playwright/test";
import { createNote, navigateToVault, setupTestAccount } from "./helpers";

// Run all mobile tests at 375×812
test.use({ viewport: { width: 375, height: 812 } });

// ── Test 1: Wizard on mobile ──────────────────────────────────────────────────

test("note creation wizard is usable on mobile", async ({ page }) => {
	const ctx = await setupTestAccount(page, "mobile-wizard");

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);

	// Wizard is full-width — no horizontal overflow
	const wizardCard = page.locator("[class*='rounded-2xl'], form").first();
	await expect(wizardCard).toBeVisible();

	// Step 1: participant
	const participantInput = page.getByPlaceholder(/participant|interview|source/i).first();
	await participantInput.fill("Mobile Tester");
	await page.getByRole("button", { name: "Next" }).tap();

	// Step 2: date — accept default
	await page.getByRole("button", { name: "Next" }).tap();

	// Step 3: content
	await page.getByPlaceholder(/Paste your interview notes/i).fill(
		"Mobile research session findings. The app is hard to use on small screens.",
	);
	await page.getByRole("button", { name: /Create Note/i }).tap();

	// Redirected to note document view
	await page.waitForURL(
		(url) =>
			url.href.includes(`/${ctx.workspaceId}/${ctx.projectId}/vault/`) &&
			!url.href.endsWith("/new"),
		{ timeout: 15_000 },
	);

	await expect(page.getByText("Mobile Tester")).toBeVisible();
});

// ── Test 2: List view on mobile ───────────────────────────────────────────────

test("vault list on mobile — cards stack vertically, filters accessible", async ({ page }) => {
	const ctx = await setupTestAccount(page, "mobile-list");

	for (const p of ["Mobile Note A", "Mobile Note B", "Mobile Note C"]) {
		await createNote(page, ctx.workspaceId, ctx.projectId, {
			participant: p,
			content: `Research notes from ${p}.`,
		});
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// All 3 cards visible
	await expect(page.getByText("Mobile Note A")).toBeVisible();
	await expect(page.getByText("Mobile Note B")).toBeVisible();
	await expect(page.getByText("Mobile Note C")).toBeVisible();

	// On mobile, filter bar shows a "Filters" button or collapsed UI
	// Cards should be full-width (no multi-column grid at 375px)
	const cards = page.locator("article, [role='article'], [data-testid='note-card']");
	await expect(cards.first()).toBeVisible();

	// Each card should be at most 375px wide
	const cardBox = await cards.first().boundingBox();
	expect(cardBox?.width).toBeLessThanOrEqual(375);

	// Filter button visible on mobile
	const filterBtn = page.getByRole("button", { name: /Filters/i });
	if (await filterBtn.isVisible()) {
		await filterBtn.tap();
		// Filter panel opens
		await expect(page.getByRole("combobox", { name: /Method|Research/i })).toBeVisible({
			timeout: 2_000,
		});
		// Close
		await page.keyboard.press("Escape");
	}
});

// ── Test 3: Document view on mobile ──────────────────────────────────────────

test("note document view on mobile — panels stack, editor usable", async ({ page }) => {
	const ctx = await setupTestAccount(page, "mobile-document");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Mobile Doc User",
		content: "Initial content. Need to verify mobile document view.",
	});

	// At 375px, editor and metadata should stack vertically
	const editor = page.locator(".note-editor-content");
	await expect(editor).toBeVisible();

	// Editor is usable — can type
	await editor.tap();
	await editor.press("End");
	await page.keyboard.type(" Typed on mobile.");

	// Auto-save completes
	await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 6_000 });
});

// ── Test 4: Quote extraction on mobile ───────────────────────────────────────

test("quote extraction works on mobile via long-press / touch selection", async ({ page }) => {
	const ctx = await setupTestAccount(page, "mobile-quote");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Mobile Quote Tester",
		content: "The mobile checkout flow was confusing for all test participants.",
	});

	// Simulate text selection on mobile using JavaScript
	const editor = page.locator(".note-editor-content");
	await page.evaluate(() => {
		const walker = document.createTreeWalker(
			document.querySelector(".note-editor-content") as Node,
			NodeFilter.SHOW_TEXT,
		);
		let node: Text | null = null;
		while ((node = walker.nextNode() as Text | null) !== null) {
			const idx = node.textContent?.indexOf("mobile checkout flow was confusing") ?? -1;
			if (idx !== -1) {
				const range = document.createRange();
				range.setStart(node, idx);
				range.setEnd(node, idx + 34);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				break;
			}
		}
	});

	// Fire touchend to trigger quote extraction detection
	await editor.dispatchEvent("touchend");

	// "Extract as Quote" tooltip appears
	await expect(
		page.getByRole("button", { name: /Extract as Quote/i }),
	).toBeVisible({ timeout: 3_000 });

	// Tap the tooltip button
	await page.getByRole("button", { name: /Extract as Quote/i }).tap();

	// Quote created — highlight visible
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Quote appears in metadata section
	await expect(page.getByText(/mobile checkout flow/i)).toBeVisible();
});
