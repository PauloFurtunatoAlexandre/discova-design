/**
 * E2E: Engine permission enforcement — viewer read-only, PM read-only, researcher full access.
 *
 * NOTE: Full permission tests require the workspace invitation flow.
 * Some tests are skipped pending that flow being testable E2E.
 */

import { expect, test } from "@playwright/test";
import {
	createManualInsight,
	createNote,
	navigateToEngine,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Admin sees "Create Insight" button ──────────────────────────────

test("admin sees Create Insight button on non-empty engine", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-perm-admin");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Admin Perm Tester",
		content: "Research notes.",
	});
	await createManualInsight(page, ctx.workspaceId, ctx.projectId, {
		statement: "Admin can see create button",
	});

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	await expect(page.getByRole("button", { name: /Create Insight/i })).toBeVisible();
});

// ── Test 2: Admin can create insights ───────────────────────────────────────

test("admin can create and see insights in engine list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-perm-admin-create");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Admin Creator",
		content: "Research for admin creation test.",
	});

	// Create via empty state CTA
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	const createBtn = page.getByRole("button", { name: /Create insight manually/i })
		.or(page.getByRole("button", { name: /Create Insight/i }));
	await createBtn.first().click();

	await page.locator("#insight-statement").fill("Admin-created insight for permission test");
	const submitButton = page.locator("dialog").getByRole("button", { name: /^Create Insight$/i });
	await submitButton.click();
	await page.waitForTimeout(1_500);

	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Admin-created insight for permission test")).toBeVisible();
});

// ── Test 3: Viewer cannot create insights (skipped pending invite flow) ─────

test.skip("viewer cannot see Create Insight button", async ({ page }) => {
	// Requires invitation flow — viewer should NOT see the Create button
	// Un-skip when the invitation/role assignment flow is testable E2E.
	const ctx = await setupTestAccount(page, "engine-perm-viewer");
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// Viewer should not see the Create button
	await expect(page.getByRole("button", { name: /Create Insight/i })).not.toBeVisible();
});

// ── Test 4: PM preset has read-only access to Engine (skipped) ──────────────

test.skip("PM preset: read-only engine — no create button", async ({ page }) => {
	// PM preset has read-only access to Engine per the permissions matrix.
	// Requires invitation + preset assignment flow.
	const ctx = await setupTestAccount(page, "engine-perm-pm");
	await navigateToEngine(page, ctx.workspaceId, ctx.projectId);

	// PM should not see the Create button
	await expect(page.getByRole("button", { name: /Create Insight/i })).not.toBeVisible();
});

// ── Test 5: Engine page renders for all authenticated users ─────────────────

test("engine page loads for any authenticated workspace member", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-perm-load");

	// Navigate to engine page
	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/engine`);
	await page.waitForLoadState("networkidle");

	// Should show either the engine page title or the empty state
	await expect(
		page.getByText(/Insight Engine/i).or(page.getByText(/No insights yet/i)),
	).toBeVisible();
});

// ── Test 6: Direct API permission check ─────────────────────────────────────

test("engine API respects workspaceId/projectId scoping", async ({ page }) => {
	const ctx = await setupTestAccount(page, "engine-perm-api");

	// Valid request with correct workspace/project
	const validRes = await page.evaluate(
		async ([wsId, projId]) => {
			const resp = await fetch(
				`/api/engine/insights?workspaceId=${wsId}&projectId=${projId}`,
			);
			return resp.status;
		},
		[ctx.workspaceId, ctx.projectId],
	);
	expect(validRes).toBe(200);

	// Invalid: missing projectId
	const invalidRes = await page.evaluate(
		async ([wsId]) => {
			const resp = await fetch(
				`/api/engine/insights?workspaceId=${wsId}`,
			);
			return resp.status;
		},
		[ctx.workspaceId],
	);
	expect(invalidRes).toBe(400);

	// Invalid: fake workspace
	const fakeRes = await page.evaluate(async () => {
		const resp = await fetch(
			"/api/engine/insights?workspaceId=00000000-0000-0000-0000-000000000000&projectId=00000000-0000-0000-0000-000000000001",
		);
		return resp.status;
	});
	expect(fakeRes).toBe(403);
});
