/**
 * E2E: Map nodes — creation, selection, context menu, deletion.
 */

import { expect, test } from "@playwright/test";
import {
	createMapNode,
	getMapNodeCount,
	navigateToMap,
	selectMapNode,
	setupTestAccount,
} from "./helpers";

// ── Test 1: Create problem node ─────────────────────────────────────────────

test("creating a problem node adds it to the canvas", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-create-problem");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Users cannot find settings",
		description: "Reported in multiple interviews",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Users cannot find settings")).toBeVisible();
	expect(await getMapNodeCount(page)).toBeGreaterThanOrEqual(1);
});

// ── Test 2: Create solution node ────────────────────────────────────────────

test("creating a solution node adds it to the canvas", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-create-solution");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "solution",
		label: "Add settings shortcut to header",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Add settings shortcut to header")).toBeVisible();
});

// ── Test 3: Node selection toggle ───────────────────────────────────────────

test("clicking a node selects it, clicking again deselects", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-select");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Selection test node",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	const node = page.locator("[data-testid='map-node']").first();
	await node.click();
	await expect(node).toHaveAttribute("aria-selected", "true");

	await node.click();
	await expect(node).toHaveAttribute("aria-selected", "false");
});

// ── Test 4: Selected node shows connection handles ──────────────────────────

test("selected node shows connection handles for editors", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-handles");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Handle test node",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	const node = page.locator("[data-testid='map-node']").first();
	await node.click();

	// Should show 3 handles (top, right, bottom)
	const handles = node.locator("[data-handle]");
	await expect(handles).toHaveCount(3);
});

// ── Test 5: Context menu appears on right-click ─────────────────────────────

test("right-clicking a node shows context menu", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-context");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Context menu test",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	const node = page.locator("[data-testid='map-node']").first();
	await node.click({ button: "right" });

	// Context menu should appear with delete option
	await expect(page.getByText(/Delete/i)).toBeVisible();
});

// ── Test 6: Node deletion via context menu ──────────────────────────────────

test("deleting a node removes it from the canvas", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-delete");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Node to delete",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	const initialCount = await getMapNodeCount(page);

	const node = page.locator("[data-testid='map-node']").first();
	await node.click({ button: "right" });

	// Click delete, then confirm
	await page.getByRole("button", { name: /Delete/i }).click();
	await page.getByRole("button", { name: /Confirm|Yes/i }).click();

	await page.waitForTimeout(2_000);
	await navigateToMap(page, ctx.workspaceId, ctx.projectId);

	expect(await getMapNodeCount(page)).toBeLessThan(initialCount);
});

// ── Test 7: Unconnected node shows dashed border ────────────────────────────

test("unconnected node has 'unconnected' base state", async ({ page }) => {
	const ctx = await setupTestAccount(page, "map-unconnected");
	await createMapNode(page, ctx.workspaceId, ctx.projectId, {
		type: "problem",
		label: "Lonely problem node",
	});

	await navigateToMap(page, ctx.workspaceId, ctx.projectId);
	const node = page.locator("[data-testid='map-node']").first();
	const baseState = await node.getAttribute("data-base-state");
	expect(baseState).toBe("unconnected");
});
