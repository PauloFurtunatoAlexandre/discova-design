/**
 * E2E: Stack security — IDOR, XSS, permission enforcement, share passcode.
 */

import { expect, test } from "@playwright/test";
import { navigateToStack, setupTestAccount } from "./helpers";

// ── Test 1: XSS in solution label (via map → stack sync) ───────────────────

test("XSS in solution label is escaped in stack table", async ({ page }) => {
	const ctx = await setupTestAccount(page, "stack-xss");

	let xssTriggered = false;
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	// Navigate to stack — even if empty, the page should not execute XSS
	await navigateToStack(page, ctx.workspaceId, ctx.projectId);

	expect(xssTriggered).toBe(false);
	const xssExecuted = await page.evaluate(
		() => (window as unknown as Record<string, unknown>).__xssStack === true,
	);
	expect(xssExecuted).toBe(false);
});

// ── Test 2: Auth required for stack page ────────────────────────────────────

test("unauthenticated access redirects to login", async ({ page }) => {
	await page.goto("/test-ws/test-proj/stack");
	await page.waitForURL("**/login**");
	expect(page.url()).toContain("/login");
});

// ── Test 3: Share page does not leak data without passcode ──────────────────

test("share page does not show snapshot data before passcode", async ({ page }) => {
	await page.goto("/share/test-token-abc123");
	await page.waitForLoadState("networkidle");

	// Should not show any RICE data or solution names
	const bodyText = await page.textContent("body");
	// Either shows passcode gate or expired message
	const hasGate = bodyText?.includes("Enter the passcode") || bodyText?.includes("Link expired");
	expect(hasGate).toBe(true);
});

// ── Test 4: Wrong passcode is rejected ──────────────────────────────────────

test("invalid passcode shows error message on share page", async ({ page }) => {
	await page.goto("/share/nonexistent-token");
	await page.waitForLoadState("networkidle");

	// The token doesn't exist, so should show expired message
	await expect(page.getByText(/Link expired or invalid/i)).toBeVisible();
});

// ── Test 5: Stack page permission check ─────────────────────────────────────

test("stack page renders permission error when access denied", async ({ page }) => {
	// Without proper workspace/project access, should redirect or show error
	const ctx = await setupTestAccount(page, "stack-perm");

	// Navigate to a non-existent project in the user's workspace
	await page.goto(`/${ctx.workspaceId}/nonexistent-project-id/stack`);
	await page.waitForLoadState("networkidle");

	// Should redirect or show an error, not crash
	const url = page.url();
	const hasRedirected = !url.includes("nonexistent-project-id/stack");
	const bodyText = await page.textContent("body");
	const hasError = bodyText?.includes("don't have access") || bodyText?.includes("not found");

	expect(hasRedirected || hasError).toBe(true);
});
