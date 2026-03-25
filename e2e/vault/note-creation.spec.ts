/**
 * E2E: Note creation wizard — full flows, validation, and autocomplete.
 */

import { expect, test } from "@playwright/test";
import { createNote, navigateToVault, setupTestAccount } from "./helpers";

// ── Test 1: Minimum fields ────────────────────────────────────────────────────

test("full creation flow — minimum fields", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-min");
	const participant = "Sarah Chen";
	const content = "The onboarding flow was confusing and users got stuck on step 3.";

	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant,
		content,
	});

	// Document view loaded — check header shows participant + date
	await expect(page.getByText(participant)).toBeVisible();
	await expect(
		page.getByText(new Date().getFullYear().toString()),
	).toBeVisible();

	// Editor content matches
	await expect(page.getByText("onboarding flow was confusing")).toBeVisible();

	// Navigate back to Vault list and confirm note appears
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText(participant)).toBeVisible();
});

// ── Test 2: With metadata ─────────────────────────────────────────────────────

test("full creation flow — with metadata", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-meta");
	const participant = "David Lim";

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);

	// Step 1: participant
	const participantInput = page.getByPlaceholder(/participant|interview|source/i).first();
	await participantInput.fill(participant);
	await page.getByRole("button", { name: "Next" }).click();

	// Step 2: date — accept default
	await page.getByRole("button", { name: "Next" }).click();

	// Step 3: content + go to metadata
	await page.getByPlaceholder(/Paste your interview notes/i).fill("Lots of feedback here.");
	await page.getByRole("button", { name: /Add Metadata/i }).click();

	// Step 4: metadata
	await page.getByRole("combobox", { name: /Research Method/i }).selectOption("interview");
	await page.getByRole("combobox", { name: /Emotional Tone/i }).selectOption("frustrated");

	// Toggle follow-up
	const followUpToggle = page.getByRole("switch", { name: /Follow.?up/i });
	await followUpToggle.click();
	await expect(followUpToggle).toHaveAttribute("aria-checked", "true");

	// Submit
	await page.getByRole("button", { name: /Create Note/i }).click();
	await page.waitForURL(`**/${ctx.workspaceId}/${ctx.projectId}/vault/**`, { timeout: 15_000 });

	// Metadata panel visible with correct values
	await expect(page.getByText("Interview")).toBeVisible();
	await expect(page.getByText("frustrated")).toBeVisible();

	// Navigate back — card shows method and follow-up
	await navigateToVault(page, ctx.workspaceId, ctx.projectId);
	await expect(page.getByText("Interview")).toBeVisible();
	await expect(page.getByText("Follow-up")).toBeVisible();
});

// ── Test 3: Wizard validation ─────────────────────────────────────────────────

test("wizard validation — empty participant blocked", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-validation");

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);

	// Step 1: Next is disabled until participant filled
	const nextBtn = page.getByRole("button", { name: "Next" });
	await expect(nextBtn).toBeDisabled();

	// Fill participant → button enables
	await page.getByPlaceholder(/participant|interview|source/i).first().fill("A");
	await expect(nextBtn).toBeEnabled();
});

test("wizard validation — future date rejected", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-date-validation");

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
	await page.getByPlaceholder(/participant|interview|source/i).first().fill("Jane Doe");
	await page.getByRole("button", { name: "Next" }).click();

	// Date input should have max=today (future dates disabled)
	const dateInput = page.getByRole("textbox", { name: /date/i }).first();
	const todayISO = new Date().toISOString().split("T")[0];
	const maxAttr = await dateInput.getAttribute("max");
	expect(maxAttr).toBe(todayISO);
});

test("wizard validation — empty content blocks create", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-content-validation");

	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
	await page.getByPlaceholder(/participant|interview|source/i).first().fill("Jane Doe");
	await page.getByRole("button", { name: "Next" }).click();
	await page.getByRole("button", { name: "Next" }).click();

	// Create Note button disabled while content empty
	const createBtn = page.getByRole("button", { name: /Create Note/i });
	await expect(createBtn).toBeDisabled();
});

// ── Test 4: Participant autocomplete ──────────────────────────────────────────

test("participant autocomplete shows matching suggestions", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-autocomplete");

	// Create two notes with "Sarah" variants
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Sarah Chen",
		content: "First note content.",
	});
	await createNote(page, ctx.workspaceId, ctx.projectId, {
		participant: "Sarah Williams",
		content: "Second note content.",
	});

	// Open wizard → type "Sarah"
	await page.goto(`/${ctx.workspaceId}/${ctx.projectId}/vault/new`);
	const participantInput = page.getByPlaceholder(/participant|interview|source/i).first();
	await participantInput.fill("Sarah");

	// Both suggestions should appear
	await expect(page.getByText("Sarah Chen")).toBeVisible({ timeout: 3_000 });
	await expect(page.getByText("Sarah Williams")).toBeVisible({ timeout: 3_000 });

	// Click first suggestion
	await page.getByRole("option", { name: "Sarah Chen" }).click();
	await expect(participantInput).toHaveValue("Sarah Chen");
});

// ── Test 5: Multiple notes appear in list ─────────────────────────────────────

test("multiple notes appear in vault list", async ({ page }) => {
	const ctx = await setupTestAccount(page, "creation-multi");

	const participants = ["Alice A", "Bob B", "Charlie C", "Diana D", "Eve E"];
	for (const p of participants) {
		await createNote(page, ctx.workspaceId, ctx.projectId, {
			participant: p,
			content: `Notes from session with ${p}.`,
		});
	}

	await navigateToVault(page, ctx.workspaceId, ctx.projectId);

	// All 5 participants visible
	for (const p of participants) {
		await expect(page.getByText(p)).toBeVisible();
	}

	// Newest first — "Eve E" created last, so should appear first
	const cards = page.locator("[data-testid='note-card'], article, [role='article']");
	const firstCard = cards.first();
	await expect(firstCard.getByText("Eve E")).toBeVisible();
});
