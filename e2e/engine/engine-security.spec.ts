/**
 * E2E: Engine security — XSS, IDOR, data isolation, API abuse.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	loginAs,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: XSS in insight statement ────────────────────────────────────────

test("XSS in insight statement — script not executed", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-xss-statement");

	let xssTriggered = false;
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "XSS Tester",
		content: "Notes for XSS test.",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Use the empty state or create button
	const createBtn = page.getByRole("button", { name: /Create insight manually/i })
		.or(page.getByRole("button", { name: /Create Insight/i }));
	await createBtn.first().click();

	// Inject XSS payload
	await page.locator("#insight-statement").fill(
		'<script>window.__xssEngine=true;alert("xss")</script>Users are confused',
	);
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();
	await page.waitForTimeout(2_000);

	// Navigate to engine page to see the rendered insight
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// XSS did not trigger
	expect(xssTriggered).toBe(false);
	const xssExecuted = await page.evaluate(
		() => (window as unknown as { __xssEngine?: boolean }).__xssEngine,
	);
	expect(xssExecuted).toBeUndefined();

	// Safe text content preserved
	await expect(page.getByText("Users are confused")).toBeVisible();
});

// ── Test 2: XSS in theme tag ────────────────────────────────────────────────

test("XSS in theme tag — rendered safely", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-xss-theme");

	let xssTriggered = false;
	page.on("dialog", (dialog) => {
		xssTriggered = true;
		dialog.dismiss();
	});

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "XSS Theme Tester",
		content: "Notes for theme XSS test.",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	const createBtn = page.getByRole("button", { name: /Create insight manually/i })
		.or(page.getByRole("button", { name: /Create Insight/i }));
	await createBtn.first().click();

	await page.locator("#insight-statement").fill("A normal insight statement");
	await page.locator("#theme-tag").fill('<img src=x onerror="alert(1)">');

	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();
	await page.waitForTimeout(2_000);

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	expect(xssTriggered).toBe(false);
});

// ── Test 3: IDOR — cross-workspace insight access ───────────────────────────

test("IDOR protection — insights isolated between workspaces", async ({ page, browser }) => {
	// User A creates an insight
	const ctxA = await setupTestAccount(page, "engine-idor-a");
	await createNote(page, ctxA.workspaceId, ctxA.projectId, {
		participant: "User A",
		content: "User A research.",
	});
	await createManualInsight(page, ctxA.workspaceId, ctxA.projectId, {
		statement: "Secret insight from workspace A",
	});

	// User B in a different workspace
	const pageB = await browser.newPage();
	const ctxB = await setupTestAccount(pageB, "engine-idor-b");

	// User B navigates to their engine page
	await navigateToEngine(pageB, ctxB.workspaceId, ctxB.projectId);

	// User B should NOT see User A's insights
	const content = await pageB.textContent("body");
	expect(content).not.toContain("Secret insight from workspace A");

	// User B tries to hit User A's API directly
	const res = await pageB.evaluate(
		async ([wsId, projId]) => {
			const resp = await fetch(
				`/api/engine/insights?workspaceId=${wsId}&projectId=${projId}`,
			);
			return { status: resp.status, body: await resp.text() };
		},
		[ctxA.workspaceId, ctxA.projectId],
	);

	// Should be 403 (User B is not a member of User A's workspace)
	expect(res.status).toBe(403);

	await pageB.close();
});

// ── Test 4: Data isolation between workspaces ───────────────────────────────

test("data isolation — users only see their own workspace insights", async ({
	page,
	browser,
}) => {
	// User A creates insights
	const ctxA = await setupTestAccount(page, "engine-isolation-a");
	await createNote(page, ctxA.workspaceId, ctxA.projectId, {
		participant: "Isolation A",
		content: "Data for isolation test A.",
	});
	await createManualInsight(page, ctxA.workspaceId, ctxA.projectId, {
		statement: "Workspace A insight alpha",
	});
	await createManualInsight(page, ctxA.workspaceId, ctxA.projectId, {
		statement: "Workspace A insight beta",
	});

	// User B creates insights
	const pageB = await browser.newPage();
	const ctxB = await setupTestAccount(pageB, "engine-isolation-b");
	await createNote(pageB, ctxB.workspaceId, ctxB.projectId, {
		participant: "Isolation B",
		content: "Data for isolation test B.",
	});
	await createManualInsight(pageB, ctxB.workspaceId, ctxB.projectId, {
		statement: "Workspace B insight gamma",
	});

	// User A sees only their insights
	await navigateToEngine(page, ctxA.workspaceId, ctxA.projectId);
	await expect(page.getByText("Workspace A insight alpha")).toBeVisible();
	await expect(page.getByText("Workspace A insight beta")).toBeVisible();
	await expect(page.getByText("Workspace B insight gamma")).not.toBeVisible();

	// User B sees only their insights
	await navigateToEngine(pageB, ctxB.workspaceId, ctxB.projectId);
	await expect(pageB.getByText("Workspace B insight gamma")).toBeVisible();
	await expect(pageB.getByText("Workspace A insight alpha")).not.toBeVisible();

	await pageB.close();
});

// ── Test 5: Unauthenticated API access ──────────────────────────────────────

test("unauthenticated requests to engine API return 401", async ({ page }) => {
	// Clear session by going to a fresh context
	const ctx = await setupTestAccount(page, "engine-unauth-api");

	// Log out (clear cookies)
	await page.context().clearCookies();

	// Try to hit the engine API
	const res = await page.evaluate(async ([wsId, projId]) => {
		const resp = await fetch(
			`/api/engine/insights?workspaceId=${wsId}&projectId=${projId}`,
		);
		return resp.status;
	}, [ctx.workspaceId, ctx.projectId]);

	expect(res).toBe(401);
});

// ── Test 6: SQL injection in search param ───────────────────────────────────

test("SQL injection attempt in search param does not leak data", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-sqli");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "SQLi Tester",
		content: "Notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Normal insight for SQL injection test",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Try SQL injection payloads in the search
	const searchInput = page.getByPlaceholder(/Search insights/i);
	await searchInput.fill("'; DROP TABLE insight_cards; --");
	await page.waitForTimeout(400);

	// Page should not crash — either shows no results or an error
	const bodyText = await page.textContent("body");
	expect(bodyText).not.toContain("error");
	expect(bodyText).not.toContain("syntax error");

	// Navigate back and verify the insight still exists
	await searchInput.clear();
	await page.waitForTimeout(400);
	await expect(page.getByText("Normal insight for SQL injection test")).toBeVisible();
});
