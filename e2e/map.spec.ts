/**
 * Map E2E test barrel — individual specs are in e2e/map/ directory.
 *
 * This file is kept for backwards compatibility with any test runner
 * that references it directly. All actual tests are in:
 *
 * - e2e/map/map-canvas.spec.ts    — Canvas rendering, zoom, shortcuts
 * - e2e/map/map-nodes.spec.ts     — Node CRUD, selection, context menu
 * - e2e/map/map-search.spec.ts    — Search overlay (Cmd+K)
 * - e2e/map/map-security.spec.ts  — XSS, IDOR, data isolation
 * - e2e/map/map-permissions.spec.ts — Permission enforcement
 */

import { test } from "@playwright/test";

test.describe("Map (see e2e/map/ for full specs)", () => {
	test("barrel file — tests are in e2e/map/", () => {
		// Tests live in individual spec files
	});
});
