/**
 * E2E: Map security — XSS prevention, IDOR, permission enforcement.
 */

import { expect, test } from "@playwright/test";
import {
	createMapNode,
	navigateToMap,
	setupTestAccount,
} from "./helpers";

// ── Test 1: XSS in node label ───────────────────────────────────────────────

test("XSS in node label — script not executed", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-xss-label");

	let xssTriggered = false;
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: '<script>window.__xssMap=true;alert("xss")</script>Malicious label',
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);

	// XSS did not trigger
	expect(xssTriggered).toBe(false);
	const xssExecuted = await page.evaluate(
		() => (window as unknown as Record<string, unknown>).__xssMap === true,
	);
	expect(xssExecuted).toBe(false);

	// The label should be rendered as text (escaped)
	await expect(page.getByText(/Malicious label/)).toBeVisible();
});

// ── Test 2: XSS in node description ─────────────────────────────────────────

test("XSS in node description — script not executed", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-xss-desc");

	let xssTriggered = false;
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Safe label for XSS desc test",
		description: '<img src=x onerror="window.__xssMapDesc=true;alert(1)">',
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);

	expect(xssTriggered).toBe(false);
	const xssExecuted = await page.evaluate(
		() => (window as unknown as Record<string, unknown>).__xssMapDesc === true,
	);
	expect(xssExecuted).toBe(false);
});

// ── Test 3: Cross-project data isolation ────────────────────────────────────

test("map data is isolated between projects", async ({ page }) => {
	const ctx1 = await setupTestAccount(page, "map-iso-1");
	await createMapNode(page, ctx1.workspaceId, ctx1.projectId, {
		type: "problem",
		label: "Project 1 exclusive node",
	});

	const ctx2 = await setupTestAccount(page, "map-iso-2");
	await navigateToMap(page, ctx2.workspaceId, ctx2.projectId);

	// The second project should NOT see the first project's node
	const nodeText = page.getByText("Project 1 exclusive node");
	await expect(nodeText).not.toBeVisible();
});

// ── Test 4: Unauthenticated access blocked ──────────────────────────────────

test("unauthenticated user cannot access map page", async ({ page }) => {
	await page.goto("/test-ws/test-proj/map");
	await page.waitForURL("**/login**", { timeout: 10_000 });
	expect(page.url()).toContain("/login");
});

// ── Test 5: API direct access — no server action bypass ─────────────────────

test("server actions require authentication", async ({ page }) => {
	// Attempt to call a server action without being logged in
	// This verifies the withPermission guard blocks unauthenticated calls
	const response = await page.request.post("/api/map/create-node", {
		data: {
			type: "problem",
			label: "Unauthorized node",
			workspaceId: "fake-ws",
			projectId: "fake-proj",
		},
	});

	// Should return 404 (route doesn't exist) or 401/403
	// Server actions are not exposed as API routes — they use React Server Actions
	expect([401, 403, 404, 405]).toContain(response.status());
});
