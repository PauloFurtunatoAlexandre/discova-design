/**
 * Tests for quote Server Actions.
 *
 * The DB and permission layers are mocked so we test the business logic:
 * IDOR protection, validation, delete warning flow, and audit entries.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Hoist mocks ────────────────────────────────────────────────────────────────
// vi.hoisted runs before module resolution, so variables defined here can safely
// be used inside vi.mock() factories.

const { mockCtx, mockDb, mockNoteRow, mockQuoteRow } = vi.hoisted(() => {
	const mockCtx = {
		userId: "user-1",
		workspaceId: "ws-1",
		projectId: "proj-1",
		tier: "member" as const,
		preset: "researcher" as const,
	};

	const mockNoteRow = { id: "note-1", projectId: "proj-1" };
	const mockQuoteRow = {
		id: "quote-1",
		text: "the onboarding flow was confusing",
		startOffset: 12,
		endOffset: 45,
		isStale: false,
		note: { projectId: "proj-1" },
	};

	const mockDb = {
		query: {
			researchNotes: {
				findFirst: vi.fn().mockResolvedValue(mockNoteRow),
			},
			quotes: {
				findFirst: vi.fn().mockResolvedValue(mockQuoteRow),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn().mockResolvedValue([
					{
						id: "quote-1",
						text: "some text",
						startOffset: 2,
						endOffset: 11,
						isStale: false,
					},
				]),
			})),
		})),
		select: vi.fn(() => ({
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ linkedCount: "0" }]),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn().mockResolvedValue(undefined),
		})),
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn().mockResolvedValue(undefined),
			})),
		})),
	};

	return { mockCtx, mockDb, mockNoteRow, mockQuoteRow };
});

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("@/lib/permissions", () => ({
	withPermission: vi.fn(
		(_opts: unknown, handler: (ctx: typeof mockCtx, args: unknown) => unknown) => (args: unknown) =>
			handler(mockCtx, args),
	),
}));

vi.mock("@/lib/auth/audit", () => ({
	createAuditEntry: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/db", () => ({ db: mockDb }));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ── Import actions AFTER mocks ─────────────────────────────────────────────────

import { createQuoteAction, deleteQuoteAction, markQuoteStaleAction } from "@/actions/quotes";

// ── createQuoteAction ─────────────────────────────────────────────────────────

describe("createQuoteAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.query.researchNotes.findFirst.mockResolvedValue(mockNoteRow);
		mockDb.insert.mockReturnValue({
			values: vi.fn(() => ({
				returning: vi
					.fn()
					.mockResolvedValue([
						{ id: "quote-1", text: "some text", startOffset: 2, endOffset: 11, isStale: false },
					]),
			})),
		});
	});

	const VALID_NOTE_ID = "00000000-0000-0000-0000-000000000001";

	it("creates a quote for valid input", async () => {
		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: VALID_NOTE_ID,
			text: "some text",
			startOffset: 2,
			endOffset: 11,
		});

		expect("success" in result && result.success).toBe(true);
		if ("success" in result) {
			expect(result.quote.id).toBe("quote-1");
			expect(result.quote.text).toBe("some text");
			expect(result.quote.startOffset).toBe(2);
			expect(result.quote.endOffset).toBe(11);
		}
	});

	it("returns the quote with correct offsets", async () => {
		mockDb.insert.mockReturnValue({
			values: vi.fn(() => ({
				returning: vi.fn().mockResolvedValue([
					{
						id: "q-2",
						text: "flow was confusing",
						startOffset: 24,
						endOffset: 42,
						isStale: false,
					},
				]),
			})),
		});

		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: VALID_NOTE_ID,
			text: "flow was confusing",
			startOffset: 24,
			endOffset: 42,
		});

		if ("success" in result) {
			expect(result.quote.startOffset).toBe(24);
			expect(result.quote.endOffset).toBe(42);
		}
	});

	it("returns error if note doesn't belong to the project (IDOR)", async () => {
		mockDb.query.researchNotes.findFirst.mockResolvedValue(null);

		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: "00000000-0000-0000-0000-000000000999",
			text: "some text",
			startOffset: 2,
			endOffset: 11,
		});

		expect("error" in result).toBe(true);
		if ("error" in result) {
			expect(result.error).toBe("Note not found");
		}
	});

	it("rejects empty text", async () => {
		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: "note-1",
			text: "",
			startOffset: 2,
			endOffset: 11,
		});

		expect("error" in result).toBe(true);
	});

	it("rejects when endOffset is less than startOffset", async () => {
		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: "note-1",
			text: "some text",
			startOffset: 11,
			endOffset: 2,
		});

		expect("error" in result).toBe(true);
	});

	it("rejects when endOffset equals startOffset", async () => {
		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: "note-1",
			text: "some text",
			startOffset: 5,
			endOffset: 5,
		});

		expect("error" in result).toBe(true);
	});

	it("rejects negative startOffset", async () => {
		const result = await createQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			noteId: "note-1",
			text: "some text",
			startOffset: -1,
			endOffset: 8,
		});

		expect("error" in result).toBe(true);
	});
});

// ── deleteQuoteAction ─────────────────────────────────────────────────────────

describe("deleteQuoteAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.query.quotes.findFirst.mockResolvedValue(mockQuoteRow);
		mockDb.select.mockReturnValue({
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ linkedCount: "0" }]),
			})),
		});
		mockDb.delete.mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) });
	});

	const VALID_QUOTE_ID = "00000000-0000-0000-0000-000000000099";

	it("deletes quote from database when not linked to insights", async () => {
		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: VALID_QUOTE_ID,
			force: true,
		});

		expect("success" in result && result.success).toBe(true);
	});

	it("returns warning if quote has linked insights and force is not set", async () => {
		mockDb.select.mockReturnValue({
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ linkedCount: "3" }]),
			})),
		});

		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: VALID_QUOTE_ID,
		});

		expect("warning" in result && result.warning).toBe(true);
		if ("warning" in result) {
			expect(result.linkedInsightCount).toBe(3);
			expect(result.message).toContain("3 insight");
		}
	});

	it("deletes even with linked insights when force=true", async () => {
		mockDb.select.mockReturnValue({
			from: vi.fn(() => ({
				where: vi.fn().mockResolvedValue([{ linkedCount: "2" }]),
			})),
		});

		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: VALID_QUOTE_ID,
			force: true,
		});

		expect("success" in result && result.success).toBe(true);
	});

	it("returns error if quote does not belong to the project (IDOR)", async () => {
		mockDb.query.quotes.findFirst.mockResolvedValue({
			...mockQuoteRow,
			note: { projectId: "other-project" },
		});

		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: VALID_QUOTE_ID,
			force: true,
		});

		expect("error" in result).toBe(true);
	});

	it("returns error for invalid quote ID (not a UUID)", async () => {
		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: "not-a-uuid",
			force: true,
		});

		expect("error" in result).toBe(true);
	});

	it("returns error if quote is not found", async () => {
		mockDb.query.quotes.findFirst.mockResolvedValue(null);

		const result = await deleteQuoteAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: "00000000-0000-0000-0000-000000000001",
			force: true,
		});

		expect("error" in result).toBe(true);
	});
});

// ── markQuoteStaleAction ──────────────────────────────────────────────────────

describe("markQuoteStaleAction", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.query.quotes.findFirst.mockResolvedValue(mockQuoteRow);
		mockDb.update.mockReturnValue({
			set: vi.fn(() => ({
				where: vi.fn().mockResolvedValue(undefined),
			})),
		});
	});

	it("marks the quote as stale", async () => {
		const result = await markQuoteStaleAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: "00000000-0000-0000-0000-000000000088",
		});

		expect("success" in result && result.success).toBe(true);
		expect(mockDb.update).toHaveBeenCalled();
	});

	it("returns error if quote is not found", async () => {
		mockDb.query.quotes.findFirst.mockResolvedValue(null);

		const result = await markQuoteStaleAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: "00000000-0000-0000-0000-000000000001",
		});

		expect("error" in result).toBe(true);
	});

	it("returns error for IDOR (quote belongs to different project)", async () => {
		mockDb.query.quotes.findFirst.mockResolvedValue({
			...mockQuoteRow,
			note: { projectId: "other-project" },
		});

		const result = await markQuoteStaleAction({
			workspaceId: "ws-1",
			projectId: "proj-1",
			quoteId: "quote-1",
		});

		expect("error" in result).toBe(true);
	});
});

// ── Multiple quotes ───────────────────────────────────────────────────────────

describe("Multiple quotes on the same note", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDb.query.researchNotes.findFirst.mockResolvedValue(mockNoteRow);
	});

	it("stores multiple quotes with distinct offsets", async () => {
		const quoteData = [
			{ text: "first quote", startOffset: 2, endOffset: 13 },
			{ text: "second quote", startOffset: 20, endOffset: 32 },
			{ text: "third quote", startOffset: 50, endOffset: 61 },
		];

		let callCount = 0;
		mockDb.insert.mockImplementation(() => ({
			values: vi.fn(() => ({
				returning: vi.fn().mockImplementation(() => {
					const q = quoteData[callCount];
					callCount++;
					return [
						{
							id: `quote-${callCount}`,
							text: q?.text ?? "",
							startOffset: q?.startOffset ?? 0,
							endOffset: q?.endOffset ?? 0,
							isStale: false,
						},
					];
				}),
			})),
		}));

		for (const q of quoteData) {
			const result = await createQuoteAction({
				workspaceId: "ws-1",
				projectId: "proj-1",
				noteId: "00000000-0000-0000-0000-000000000001",
				...q,
			});
			expect("success" in result && result.success).toBe(true);
		}

		expect(callCount).toBe(3);
	});
});
