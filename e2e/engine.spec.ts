/**
 * Engine E2E tests — see e2e/engine/ directory for full test suites.
 *
 * This file is kept as an index; individual test files are:
 *   - engine-list.spec.ts       — search, filter, sort, empty state
 *   - engine-filter.spec.ts     — theme, confidence, connection filters
 *   - engine-sort.spec.ts       — sort order verification
 *   - engine-pagination.spec.ts — cursor-based load more
 *   - create-insight.spec.ts    — slide-over form validation + submission
 *   - engine-security.spec.ts   — XSS, IDOR, data isolation, SQL injection
 *   - engine-permissions.spec.ts — role-based access enforcement
 *   - engine-mobile.spec.ts     — responsive layout tests
 */

import { test } from "@playwright/test";

test.describe("Engine (see e2e/engine/ for full suites)", () => {
	test("placeholder — tests in e2e/engine/ directory", async () => {
		// Individual test files handle all Engine E2E testing.
		// This file exists to maintain the top-level spec convention.
	});
});
