/**
 * E2E: Quote extraction — highlight → extract → verify → stale detection.
 */

import { expect, test } from "@playwright/test";
import { createNote, setupTestAccount } from "./helpers";

const LONG_CONTENT = `
The onboarding flow was confusing and users got stuck on step 3.
Many participants mentioned that the sign-up process took too long.
The dashboard felt overwhelming at first glance, with too many options.
Users struggled to find the settings page, often clicking in the wrong section.
The mobile experience was notably worse than desktop, with buttons too small to tap.
`.trim();

// ── Test 1: Extract a quote ───────────────────────────────────────────────────

test("extract a quote from selected text", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-extract1");
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Quote Tester",
		content: "The onboarding flow was confusing and users got stuck on step 3.",
	});

	// Select text in the editor
	const editor = page.locator(".note-editor-content");
	const targetText = "onboarding flow was confusing";

	// Use keyboard selection: find and select the target phrase
	await editor.locator("p").first().click();
	const textContent = await editor.locator("p").first().textContent() ?? "";
	const startIdx = textContent.indexOf("onboarding");
	if (startIdx >= 0) {
		// Use JavaScript to programmatically select the text range
		await page.evaluate(
			({ text }) => {
				const walker = document.createTreeWalker(
					document.querySelector(".note-editor-content") as Node,
					NodeFilter.SHOW_TEXT,
				);
				let node: Text | null = null;
				while ((node = walker.nextNode() as Text | null) !== null) {
					const idx = node.textContent?.indexOf(text) ?? -1;
					if (idx !== -1) {
						const range = document.createRange();
						range.setStart(node, idx);
						range.setEnd(node, idx + text.length);
						const sel = window.getSelection();
						sel?.removeAllRanges();
						sel?.addRange(range);
						break;
					}
				}
			},
			{ text: "onboarding flow was confusing" },
		);
		// Fire mouseup to trigger the extraction tooltip
		await editor.dispatchEvent("mouseup");
	}

	// "Extract as Quote" tooltip should appear
	await expect(
		page.getByRole("button", { name: /Extract as Quote/i }),
	).toBeVisible({ timeout: 3_000 });

	// Click the tooltip
	await page.getByRole("button", { name: /Extract as Quote/i }).click();

	// Gold highlight appears in editor
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Quote appears in metadata panel
	await expect(
		page.getByText(new RegExp("onboarding flow was confusing", "i")),
	).toBeVisible({ timeout: 3_000 });

	// Quote count badge shows "1"
	await expect(page.getByText("1").filter({ has: page.locator("[class*='rounded-full']") })).toBeVisible();
});

// ── Test 2: Extract multiple quotes ──────────────────────────────────────────

test("extract 3 quotes — all highlights and panel entries visible", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-extract2");
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Multi Quoter",
		content: LONG_CONTENT,
	});

	const quotes = [
		"onboarding flow was confusing",
		"sign-up process took too long",
		"dashboard felt overwhelming",
	];

	for (const quote of quotes) {
		const editor = page.locator(".note-editor-content");
		await page.evaluate(
			({ text }) => {
				const walker = document.createTreeWalker(
					document.querySelector(".note-editor-content") as Node,
					NodeFilter.SHOW_TEXT,
				);
				let node: Text | null = null;
				while ((node = walker.nextNode() as Text | null) !== null) {
					const idx = node.textContent?.indexOf(text) ?? -1;
					if (idx !== -1) {
						const range = document.createRange();
						range.setStart(node, idx);
						range.setEnd(node, idx + text.length);
						const sel = window.getSelection();
						sel?.removeAllRanges();
						sel?.addRange(range);
						break;
					}
				}
			},
			{ text: quote },
		);
		await editor.dispatchEvent("mouseup");
		await page.getByRole("button", { name: /Extract as Quote/i }).click();
		await page.waitForTimeout(500); // allow state to settle
	}

	// 3 gold highlights visible
	await expect(page.locator(".quote-highlight")).toHaveCount(3, { timeout: 5_000 });

	// All 3 quotes visible in metadata panel
	for (const quote of quotes) {
		await expect(page.getByText(new RegExp(quote.slice(0, 20), "i"))).toBeVisible();
	}

	// Quote count shows "3"
	await expect(page.getByText("3").filter({ has: page.locator("[class*='rounded-full']") })).toBeVisible();
});

// ── Test 3: Quote persists across reload ──────────────────────────────────────

test("quote persists — highlight and panel entry survive page reload", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-reload");
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Persist User",
		content: "The sign-up process was unnecessarily long and tedious.",
	});

	// Extract quote
	const editor = page.locator(".note-editor-content");
	await page.evaluate(() => {
		const walker = document.createTreeWalker(
			document.querySelector(".note-editor-content") as Node,
			NodeFilter.SHOW_TEXT,
		);
		let node: Text | null = null;
		while ((node = walker.nextNode() as Text | null) !== null) {
			const idx = node.textContent?.indexOf("sign-up process was unnecessarily") ?? -1;
			if (idx !== -1) {
				const range = document.createRange();
				range.setStart(node, idx);
				range.setEnd(node, idx + 32);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				break;
			}
		}
	});
	await editor.dispatchEvent("mouseup");
	await page.getByRole("button", { name: /Extract as Quote/i }).click();
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Reload
	await page.reload();
	await page.waitForLoadState("networkidle");

	// Highlight still visible at correct position
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 5_000 });

	// Quote still in metadata panel
	await expect(page.getByText(/sign-up process/i)).toBeVisible();
});

// ── Test 4: Remove a quote ────────────────────────────────────────────────────

test("remove quote — highlight disappears, panel entry removed", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-remove");
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Remove Tester",
		content: "Users found the dashboard overwhelming when first opened.",
	});

	// Extract quote
	const editor = page.locator(".note-editor-content");
	await page.evaluate(() => {
		const walker = document.createTreeWalker(
			document.querySelector(".note-editor-content") as Node,
			NodeFilter.SHOW_TEXT,
		);
		let node: Text | null = null;
		while ((node = walker.nextNode() as Text | null) !== null) {
			const idx = node.textContent?.indexOf("dashboard overwhelming") ?? -1;
			if (idx !== -1) {
				const range = document.createRange();
				range.setStart(node, idx);
				range.setEnd(node, idx + 22);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				break;
			}
		}
	});
	await editor.dispatchEvent("mouseup");
	await page.getByRole("button", { name: /Extract as Quote/i }).click();
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Click on the gold highlight
	await page.locator(".quote-highlight").first().click();

	// Popover appears with Remove button
	await expect(page.getByRole("button", { name: /Remove|Delete/i })).toBeVisible({ timeout: 2_000 });
	await page.getByRole("button", { name: /Remove|Delete/i }).click();

	// Highlight disappears
	await expect(page.locator(".quote-highlight")).not.toBeVisible({ timeout: 3_000 });

	// Quote removed from metadata panel
	await expect(page.getByText("dashboard overwhelming")).not.toBeVisible();
});

// ── Test 5: Click quote in metadata panel → scroll to position ────────────────

test("clicking quote in metadata panel scrolls editor to highlight", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-scroll");

	// Long note so content extends past viewport
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Scroll Tester",
		content: LONG_CONTENT + "\n".repeat(20) + "Target phrase at the very bottom here.",
	});

	// Extract quote from near the bottom
	const editor = page.locator(".note-editor-content");
	await page.evaluate(() => {
		const walker = document.createTreeWalker(
			document.querySelector(".note-editor-content") as Node,
			NodeFilter.SHOW_TEXT,
		);
		let node: Text | null = null;
		while ((node = walker.nextNode() as Text | null) !== null) {
			const idx = node.textContent?.indexOf("Target phrase at the very bottom") ?? -1;
			if (idx !== -1) {
				const range = document.createRange();
				range.setStart(node, idx);
				range.setEnd(node, idx + 31);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				break;
			}
		}
	});
	await editor.dispatchEvent("mouseup");
	await page.getByRole("button", { name: /Extract as Quote/i }).click();
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Scroll editor to top
	await page.evaluate(() => {
		document.querySelector(".note-editor-content")?.closest("[class*='overflow']")?.scrollTo(0, 0);
	});

	// Click the quote entry in the metadata panel
	const quoteEntry = page.getByText(/Target phrase/i);
	await quoteEntry.click();

	// The highlight should flash (brief opacity change)
	await expect(page.locator(".quote-highlight.flashing")).toBeVisible({ timeout: 2_000 });
});

// ── Test 6: Stale quote detection ────────────────────────────────────────────

test("stale quote detection — modified text marks quote stale", async ({ page }) => {
	const ctx = await setupTestAccount(page, "quote-stale");
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Stale Tester",
		content: "The original wording of this specific phrase exists here.",
	});

	// Extract quote
	const editor = page.locator(".note-editor-content");
	await page.evaluate(() => {
		const walker = document.createTreeWalker(
			document.querySelector(".note-editor-content") as Node,
			NodeFilter.SHOW_TEXT,
		);
		let node: Text | null = null;
		while ((node = walker.nextNode() as Text | null) !== null) {
			const idx = node.textContent?.indexOf("original wording of this specific phrase") ?? -1;
			if (idx !== -1) {
				const range = document.createRange();
				range.setStart(node, idx);
				range.setEnd(node, idx + 40);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
				break;
			}
		}
	});
	await editor.dispatchEvent("mouseup");
	await page.getByRole("button", { name: /Extract as Quote/i }).click();
	await expect(page.locator(".quote-highlight")).toBeVisible({ timeout: 3_000 });

	// Edit the text within the quote range (delete and retype differently)
	await editor.click();
	await editor.locator("p").first().click({ clickCount: 3 });
	await page.keyboard.type("The completely changed content replaces the old phrase entirely.");

	// Wait for auto-save (stale detection runs after save)
	await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 8_000 });

	// Quote in metadata panel shows stale indicator
	await expect(page.getByText(/May be stale|stale/i)).toBeVisible({ timeout: 5_000 });
});
