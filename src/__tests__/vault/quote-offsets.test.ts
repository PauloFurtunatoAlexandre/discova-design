/**
 * Tests for the quote offset utilities.
 *
 * These are pure unit tests for the non-editor functions.
 * The editor-dependent functions (selectionToOffsets, getPlainTextAtRange)
 * are tested via mock editor objects.
 */

import {
	doesChangeOverlapQuote,
	getPlainTextAtRange,
	selectionToOffsets,
} from "@/lib/vault/quote-offsets";
import { describe, expect, it, vi } from "vitest";

// ── doesChangeOverlapQuote ────────────────────────────────────────────────────

describe("doesChangeOverlapQuote", () => {
	it("returns true when change overlaps the start of a quote", () => {
		// change [5, 15) overlaps quote [10, 20)
		expect(doesChangeOverlapQuote(5, 15, 10, 20)).toBe(true);
	});

	it("returns true when change overlaps the end of a quote", () => {
		// change [15, 25) overlaps quote [10, 20)
		expect(doesChangeOverlapQuote(15, 25, 10, 20)).toBe(true);
	});

	it("returns true when change is entirely within a quote", () => {
		// change [12, 18) is inside quote [10, 20)
		expect(doesChangeOverlapQuote(12, 18, 10, 20)).toBe(true);
	});

	it("returns true when change contains the entire quote", () => {
		// change [5, 25) wraps around quote [10, 20)
		expect(doesChangeOverlapQuote(5, 25, 10, 20)).toBe(true);
	});

	it("returns false when change is entirely before the quote", () => {
		// change [0, 9) ends before quote [10, 20) starts
		expect(doesChangeOverlapQuote(0, 9, 10, 20)).toBe(false);
	});

	it("returns false when change is entirely after the quote", () => {
		// change [21, 30) starts after quote [10, 20) ends
		expect(doesChangeOverlapQuote(21, 30, 10, 20)).toBe(false);
	});

	it("edge case — change ends exactly where quote starts (adjacent, no overlap)", () => {
		// change [5, 10) ends exactly at quote [10, 20) start — no overlap
		expect(doesChangeOverlapQuote(5, 10, 10, 20)).toBe(false);
	});

	it("edge case — change starts exactly where quote ends (adjacent, no overlap)", () => {
		// change [20, 30) starts exactly at quote [10, 20) end — no overlap
		expect(doesChangeOverlapQuote(20, 30, 10, 20)).toBe(false);
	});
});

// ── selectionToOffsets ────────────────────────────────────────────────────────

function makeMockEditor(from: number, to: number, empty: boolean, text: string) {
	return {
		state: {
			selection: { from, to, empty },
			doc: {
				textBetween: vi.fn().mockReturnValue(text),
			},
		},
	};
}

describe("selectionToOffsets", () => {
	it("returns null for an empty selection", () => {
		const editor = makeMockEditor(5, 5, true, "");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = selectionToOffsets(editor as any);
		expect(result).toBeNull();
	});

	it("returns null when selected text is only whitespace", () => {
		const editor = makeMockEditor(5, 8, false, "   ");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = selectionToOffsets(editor as any);
		expect(result).toBeNull();
	});

	it("returns correct offsets for a non-empty selection", () => {
		const editor = makeMockEditor(3, 18, false, "the onboarding flow");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = selectionToOffsets(editor as any);
		expect(result).toEqual({
			text: "the onboarding flow",
			startOffset: 3,
			endOffset: 18,
		});
	});

	it("uses ProseMirror from/to positions directly as offsets", () => {
		const editor = makeMockEditor(42, 99, false, "some selected text");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = selectionToOffsets(editor as any);
		expect(result?.startOffset).toBe(42);
		expect(result?.endOffset).toBe(99);
	});
});

// ── getPlainTextAtRange ───────────────────────────────────────────────────────

function makeMockEditorForRange(docSize: number, textAtRange: string, shouldThrow = false) {
	return {
		state: {
			doc: {
				content: { size: docSize },
				textBetween: shouldThrow
					? vi.fn().mockImplementation(() => {
							throw new Error("out of range");
						})
					: vi.fn().mockReturnValue(textAtRange),
			},
		},
	};
}

describe("getPlainTextAtRange", () => {
	it("returns text at a valid range", () => {
		const editor = makeMockEditorForRange(100, "hello world");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = getPlainTextAtRange(editor as any, 5, 16);
		expect(result).toBe("hello world");
	});

	it("returns empty string when startOffset is negative", () => {
		const editor = makeMockEditorForRange(100, "hello");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = getPlainTextAtRange(editor as any, -1, 5);
		expect(result).toBe("");
	});

	it("returns empty string when endOffset exceeds doc size", () => {
		const editor = makeMockEditorForRange(10, "hello");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = getPlainTextAtRange(editor as any, 5, 20);
		expect(result).toBe("");
	});

	it("returns empty string when startOffset >= endOffset", () => {
		const editor = makeMockEditorForRange(100, "");
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = getPlainTextAtRange(editor as any, 10, 10);
		expect(result).toBe("");
	});

	it("returns empty string when textBetween throws", () => {
		const editor = makeMockEditorForRange(100, "", true);
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const result = getPlainTextAtRange(editor as any, 5, 15);
		expect(result).toBe("");
	});

	it("round-trip: offsets stored from selection match text at range", () => {
		// Simulate: select text → get offsets → retrieve text at offsets
		const selectedText = "the onboarding flow was confusing";
		const from = 12;
		const to = from + selectedText.length;

		const editorForSelect = makeMockEditor(from, to, false, selectedText);
		// biome-ignore lint/suspicious/noExplicitAny: mock editor
		const offsets = selectionToOffsets(editorForSelect as any);
		expect(offsets).not.toBeNull();

		if (!offsets) throw new Error("Expected offsets to be non-null");
		const editorForRange = makeMockEditorForRange(200, selectedText);
		const editorForRangeAny = editorForRange as unknown as Parameters<
			typeof getPlainTextAtRange
		>[0];
		const retrieved = getPlainTextAtRange(
			editorForRangeAny,
			offsets.startOffset,
			offsets.endOffset,
		);
		expect(retrieved).toBe(selectedText);
	});
});
