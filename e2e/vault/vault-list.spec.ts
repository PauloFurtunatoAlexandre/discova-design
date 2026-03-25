/**
 * E2E: Vault list — search, filter, sort, pagination, empty states.
 */

import { expect, test } from "@playwright/test";
import { createNote, navigateToVault, setupTestAccount } from "./helpers";

// ── Test 1: Search by participant name ────────────────────────────────────────

test("search by participant name filters results", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-search-participant");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Alice",
		content: "Alice's research notes.",
	});
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Alice Smith",
		content: "Alice Smith's research notes.",
	});
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Bob",
		content: "Bob's research notes.",
	});

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Type in search
	const searchInput = page.getByPlaceholder(/Search/i).first();
	await searchInput.fill("Alice");
	await page.waitForTimeout(400); // debounce

	// Only Alice notes visible
	await expect(page.getByText("Alice")).toBeVisible();
	await expect(page.getByText("Alice Smith")).toBeVisible();
	await expect(page.getByText("Bob")).not.toBeVisible();

	// Clear search → all 3 return
	await searchInput.clear();
	await page.waitForTimeout(400);
	await expect(page.getByText("Bob")).toBeVisible();
	await expect(page.getByText("Alice")).toBeVisible();
});

// ── Test 2: Search by content ─────────────────────────────────────────────────

test("search by note content returns matching note", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-search-content");

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Content Searcher",
		content: "The user experienced friction in the checkout flow specifically.",
	});
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Unrelated Note",
		content: "Nothing relevant here.",
	});

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	const searchInput = page.getByPlaceholder(/Search/i).first();
	await searchInput.fill("checkout");
	await page.waitForTimeout(400);

	await expect(page.getByText("Content Searcher")).toBeVisible();
	await expect(page.getByText("Unrelated Note")).not.toBeVisible();
});

// ── Test 3: Filter by research method ────────────────────────────────────────

test("filter by research method shows only matching notes", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-filter-method");

	// Create 3 interview notes and 2 survey notes via the wizard + metadata step
	const interviewParticipants = ["Interview User 1", "Interview User 2", "Interview User 3"];
	const surveyParticipants = ["Survey User 1", "Survey User 2"];

	for (const participant of interviewParticipants) {
		await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
		await page.getByPlaceholder(/participant|interview|source/i).first().fill(participant);
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByPlaceholder(/Paste your interview notes/i).fill("Interview research findings.");
		await page.getByRole("button", { name: /Add Metadata/i }).click();
		await page.selectOption("#meta-panel-method, select[id='meta-panel-method']", "interview");
		await page.getByRole("button", { name: /Create Note/i }).click();
		await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`);
	}

	for (const participant of surveyParticipants) {
		await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
		await page.getByPlaceholder(/participant|interview|source/i).first().fill(participant);
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByPlaceholder(/Paste your interview notes/i).fill("Survey data collected.");
		await page.getByRole("button", { name: /Add Metadata/i }).click();
		await page.selectOption("#meta-panel-method, select[id='meta-panel-method']", "survey");
		await page.getByRole("button", { name: /Create Note/i }).click();
		await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`);
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Select "Interview" filter
	await page.getByRole("combobox", { name: /Method|Research/i }).selectOption("interview");
	await page.waitForTimeout(400);

	// Only interview notes visible
	for (const p of interviewParticipants) {
		await expect(page.getByText(p)).toBeVisible();
	}
	for (const p of surveyParticipants) {
		await expect(page.getByText(p)).not.toBeVisible();
	}

	// Clear filter → 5 notes visible
	await page.getByRole("combobox", { name: /Method|Research/i }).selectOption("");
	await page.waitForTimeout(400);
	for (const p of [...interviewParticipants, ...surveyParticipants]) {
		await expect(page.getByText(p)).toBeVisible();
	}
});

// ── Test 4: Combined method + tone filter ─────────────────────────────────────

test("combined method + tone filter narrows to correct subset", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-filter-combined");

	const notes = [
		{ participant: "Frustrated Interview 1", method: "interview", tone: "frustrated" },
		{ participant: "Frustrated Interview 2", method: "interview", tone: "frustrated" },
		{ participant: "Delighted Interview", method: "interview", tone: "delighted" },
		{ participant: "Frustrated Survey 1", method: "survey", tone: "frustrated" },
		{ participant: "Frustrated Survey 2", method: "survey", tone: "frustrated" },
	];

	for (const n of notes) {
		await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
		await page.getByPlaceholder(/participant|interview|source/i).first().fill(n.participant);
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByPlaceholder(/Paste your interview notes/i).fill("Research findings.");
		await page.getByRole("button", { name: /Add Metadata/i }).click();
		await page.selectOption("#meta-panel-method", n.method);
		await page.selectOption("#meta-panel-tone", n.tone);
		await page.getByRole("button", { name: /Create Note/i }).click();
		await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`);
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Filter: Interview + Frustrated
	await page.getByRole("combobox", { name: /Method|Research/i }).selectOption("interview");
	await page.getByRole("combobox", { name: /Tone|Emotional/i }).selectOption("frustrated");
	await page.waitForTimeout(400);

	// Only the 2 frustrated interviews
	await expect(page.getByText("Frustrated Interview 1")).toBeVisible();
	await expect(page.getByText("Frustrated Interview 2")).toBeVisible();
	await expect(page.getByText("Delighted Interview")).not.toBeVisible();
	await expect(page.getByText("Frustrated Survey 1")).not.toBeVisible();
});

// ── Test 5: Sort by participant A–Z ──────────────────────────────────────────

test("sort by participant A-Z orders notes alphabetically", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-sort");

	for (const participant of ["Charlie C", "Alice A", "Bob B"]) {
		await createNote(page, ctx.workspaceId, ctx.projectId, {
			participant,
			content: `Notes from ${participant}.`,
		});
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Select sort A–Z
	await page.getByRole("combobox", { name: /Sort/i }).selectOption("participant_asc");
	await page.waitForTimeout(400);

	// Check order: Alice, Bob, Charlie
	const cardTexts = await page.locator("article, [role='article'], [data-testid='note-card']")
		.allTextContents();
	const names = cardTexts.map((t) => {
		if (t.includes("Alice A")) return "Alice";
		if (t.includes("Bob B")) return "Bob";
		if (t.includes("Charlie C")) return "Charlie";
		return "";
	}).filter(Boolean);

	expect(names[0]).toBe("Alice");
	expect(names[1]).toBe("Bob");
	expect(names[2]).toBe("Charlie");
});

// ── Test 6: Cursor-based pagination ──────────────────────────────────────────

test("load more button appends next page without duplicates", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-pagination");

	// Create 25 notes
	for (let i = 1; i <= 25; i++) {
		await createNote(page, ctx.workspaceId, ctx.projectId, {
			participant: `Pagination User ${i.toString().padStart(2, "0")}`,
			content: `Note ${i} content for pagination test.`,
		});
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Default limit=20 — 20 cards visible + "Load more" button
	const cards = page.locator("article, [role='article'], [data-testid='note-card']");
	await expect(cards).toHaveCount(20, { timeout: 5_000 });
	await expect(page.getByRole("button", { name: /Load more/i })).toBeVisible();

	// Click "Load more"
	await page.getByRole("button", { name: /Load more/i }).click();
	await page.waitForTimeout(1_000); // wait for fetch

	// 25 cards total, no "Load more"
	await expect(cards).toHaveCount(25, { timeout: 5_000 });
	await expect(page.getByRole("button", { name: /Load more/i })).not.toBeVisible();

	// Verify no duplicate IDs (all participants unique)
	const allTexts = await cards.allTextContents();
	const participants = allTexts.filter((t) => t.includes("Pagination User"));
	const uniqueParticipants = new Set(participants.map((t) => t.match(/Pagination User \d+/)?.[0]));
	expect(uniqueParticipants.size).toBe(participants.length);
});

// ── Test 7: Empty state ───────────────────────────────────────────────────────

test("empty project shows 'Start with an interview note' CTA", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-empty");
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Empty state visible
	await expect(
		page.getByText(/Start with an interview note|Your research vault is empty/i),
	).toBeVisible();

	// CTA button navigates to wizard
	const ctaButton = page.getByRole("link", { name: /Add|Start|New note/i }).first();
	await ctaButton.click();
	await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
});

// ── Test 8: No-results state ──────────────────────────────────────────────────

test("no results state shows clear filters option", async ({ page }) => {
	const ctx = await setupTestAccount(page, "list-no-results");

	// Create 3 interview notes
	for (let i = 1; i <= 3; i++) {
		await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
		await page.getByPlaceholder(/participant|interview|source/i).first().fill(`Interview User ${i}`);
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByRole("button", { name: "Next" }).click();
		await page.getByPlaceholder(/Paste your interview notes/i).fill("Interview notes.");
		await page.getByRole("button", { name: /Add Metadata/i }).click();
		await page.selectOption("#meta-panel-method", "interview");
		await page.getByRole("button", { name: /Create Note/i }).click();
		await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`);
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// Filter by survey (no results)
	await page.getByRole("combobox", { name: /Method|Research/i }).selectOption("survey");
	await page.waitForTimeout(400);

	await expect(page.getByText(/No notes match|no results/i)).toBeVisible();

	// Clear filters restores notes
	await page.getByRole("button", { name: /Clear all filters/i }).click();
	await page.waitForTimeout(400);
	for (let i = 1; i <= 3; i++) {
		await expect(page.getByText(`Interview User ${i}`)).toBeVisible();
	}
});
