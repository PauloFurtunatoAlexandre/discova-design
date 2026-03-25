/**
 * E2E: Security tests — XSS, IDOR, data isolation, input validation.
 */

import { expect, test } from "@playwright/test";
import { createNote, navigateToVault, setupTestAccount } from "./helpers";

// Track XSS attempts
let xssTriggered = false;

// ── Test 1: XSS in note content ───────────────────────────────────────────────

test("XSS in note content — script tags stripped or not executed", async ({ page }) => {
	const ctx = await setupTestAccount(page, "security-xss-content");

	// Listen for dialog (would appear if XSS fires)
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
	await page.getByPlaceholder(/participant|interview|source/i).first().fill("XSS Content Test");
	await page.getByRole("button", { name: "Next" }).click();
	await page.getByRole("button", { name: "Next" }).click();
	await page.getByPlaceholder(/Paste your interview notes/i).fill(
		'<script>window.__xssTest=true;alert("xss")</script>Hello world',
	);
	await page.getByRole("button", { name: /Create Note/i }).click();
	await page.waitForURL(
		(url) =>
			url.href.includes(`/${ctx.workspaceId}/${ctx.projectId}/vault/`) &&
			!url.href.endsWith("/new"),
		{ timeout: 15_000 },
	);

	// XSS did not trigger
	expect(xssTriggered).toBe(false);

	// "Hello world" visible (safe content preserved)
	await expect(page.getByText("Hello world")).toBeVisible();

	// No live script execution
	const xssExecuted = await page.evaluate(() => (window as unknown as { __xssTest?: boolean }).__xssTest);
	expect(xssExecuted).toBeUndefined();
});

// ── Test 2: XSS in participant name ──────────────────────────────────────────

test("XSS in participant name — rendered safely in vault list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "security-xss-participant");

	let xssParticipantTriggered = false;
	page.on("dialog", (dialog) => {
		xssParticipantTriggered = true;
		dialog.dismiss();
	});

	// Try to set participant name with XSS payload via API (since wizard may sanitize)
	// Use the wizard flow — the participant name is rendered in the card
	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
	const participantInput = page.getByPlaceholder(/participant|interview|source/i).first();
	// Fill the XSS payload
	await participantInput.fill('<img src=x onerror="window.__xssParticipant=true">');
	await page.getByRole("button", { name: "Next" }).click();
	await page.getByRole("button", { name: "Next" }).click();
	await page.getByPlaceholder(/Paste your interview notes/i).fill("Testing XSS in participant name.");
	await page.getByRole("button", { name: /Create Note/i }).click();
	await page.waitForURL(
		(url) =>
			url.href.includes(`/${ctx.workspaceId}/${ctx.projectId}/vault/`) &&
			!url.href.endsWith("/new"),
		{ timeout: 15_000 },
	);

	// Navigate to list where participant name is rendered
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);
	await page.waitForLoadState("networkidle");

	// XSS did not execute
	expect(xssParticipantTriggered).toBe(false);
	const xssRan = await page.evaluate(
		() => (window as unknown as { __xssParticipant?: boolean }).__xssParticipant,
	);
	expect(xssRan).toBeUndefined();
});

// ── Test 3: IDOR — cross-workspace note access ────────────────────────────────

test("IDOR protection — cross-workspace note access denied", async ({ page, browser }) => {
	// User A creates a note
	const ctxA = await setupTestAccount(page, "security-idor-ws-a");
	await createNote(page, ctxA.workspaceId, ctxA.projectId, {
		participant: "User A Private",
		content: "This content belongs exclusively to User A.",
	});
	const noteAUrl = page.url(); // /{wsA}/{projA}/vault/{noteId}
	const noteId = noteAUrl.split("/").pop() ?? "";

	// User B in a completely different workspace
	const pageB = await browser.newPage();
	const ctxB = await setupTestAccount(pageB, "security-idor-ws-b");

	// User B attempts to access User A's note via User B's workspace+project
	await pageB.goto(`/${ctxB.workspaceId}/${ctxB.projectId}/vault/${noteId}`);
	await pageB.waitForLoadState("networkidle");

	// Should NOT see User A's content — either 404, redirect, or error
	const content = await pageB.textContent("body");
	expect(content).not.toContain("This content belongs exclusively to User A");
	expect(content).not.toContain("User A Private");

	// Should be redirected or show not-found
	const finalUrl = pageB.url();
	const isRedirected =
		!finalUrl.includes(noteId) ||
		(await pageB.locator("h1, h2").textContent())?.toLowerCase().includes("not found");
	expect(isRedirected || content?.includes("not found") || content?.includes("404")).toBeTruthy();

	await pageB.close();
});

// ── Test 4: IDOR — cross-project note access ──────────────────────────────────

test("IDOR protection — cross-project note access denied", async ({ page }) => {
	// One user with two projects (one from onboarding + create another)
	const ctx = await setupTestAccount(page, "security-idor-proj");

	// Create note in the first project (from onboarding)
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Project A Only",
		content: "This note lives in Project A only.",
	});
	const noteUrl = page.url();
	const noteId = noteUrl.split("/").pop() ?? "";

	// Create a second project
	await page.goto(`/${ctx.workspaceId}/settings`);
	// Find "New project" or use the sidebar create project flow
	// For simplicity, use a fake projectId to test IDOR
	const fakeProjectId = "00000000-0000-0000-0000-000000000001";
	await page.goto(`/${ctx.workspaceId}/${fakeProjectId}/vault/${noteId}`);
	await page.waitForLoadState("networkidle");

	// Should not show the note content from the other project
	const content = await page.textContent("body");
	expect(content).not.toContain("This note lives in Project A only.");
});

// ── Test 5: Session recording URL validation ──────────────────────────────────

test("session recording URL: javascript: protocol rejected, https: accepted", async ({ page }) => {
	const ctx = await setupTestAccount(page, "security-url-validation");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "URL Validator",
		content: "Testing session recording URL validation.",
	});

	// Try javascript: protocol
	const urlInput = page.locator("#meta-panel-recording");
	await urlInput.fill("javascript:alert(1)");
	await urlInput.press("Tab"); // blur to trigger save attempt

	// The input should either be blocked by the browser's type="url" validation,
	// or the server action should reject it and show an error.
	// Either way, the "Open" link should NOT appear (it only shows for valid URLs)
	await expect(page.getByRole("link", { name: /Open/i })).not.toBeVisible();

	// Enter a valid https URL → accepted, "Open" link appears
	await urlInput.fill("https://loom.com/share/abc123");
	await urlInput.press("Tab"); // blur

	await expect(page.getByRole("link", { name: /Open/i })).toBeVisible({ timeout: 3_000 });
});

// ── Test 6: Data isolation between workspaces ─────────────────────────────────

test("data isolation — users in different workspaces see only their own notes", async ({
	page,
	browser,
}) => {
	// User A creates 3 notes
	const ctxA = await setupTestAccount(page, "security-isolation-a");
	for (const p of ["User A Note 1", "User A Note 2", "User A Note 3"]) {
		await createNote(page, ctxA.workspaceId, ctxA.projectId, {
			participant: p,
			content: `Private content for ${p}`,
		});
	}

	// User B creates 2 notes in their own workspace
	const pageB = await browser.newPage();
	const ctxB = await setupTestAccount(pageB, "security-isolation-b");
	for (const p of ["User B Note 1", "User B Note 2"]) {
		await createNote(pageB, ctxB.workspaceId, ctxB.projectId, {
			participant: p,
			content: `Private content for ${p}`,
		});
	}

	// User A sees only their 3 notes
	await navigateToVault(page, ctxA.workspaceId, ctxA.projectId);
	for (let i = 1; i <= 3; i++) {
		await expect(page.getByText(`User A Note ${i}`)).toBeVisible();
	}
	await expect(page.getByText("User B Note 1")).not.toBeVisible();
	await expect(page.getByText("User B Note 2")).not.toBeVisible();

	// User B sees only their 2 notes
	await navigateToVault(pageB, ctxB.workspaceId, ctxB.projectId);
	for (let i = 1; i <= 2; i++) {
		await expect(pageB.getByText(`User B Note ${i}`)).toBeVisible();
	}
	await expect(pageB.getByText("User A Note 1")).not.toBeVisible();

	// Search in User A's vault for User B's content → 0 results
	const searchInput = page.getByPlaceholder(/Search/i).first();
	await searchInput.fill("User B Note");
	await page.waitForTimeout(400);
	await expect(page.getByText("User B Note 1")).not.toBeVisible();
	await expect(page.getByText("User B Note 2")).not.toBeVisible();

	await pageB.close();
});
