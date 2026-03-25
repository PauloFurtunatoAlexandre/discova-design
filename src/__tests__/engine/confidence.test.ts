import { type EvidenceInput, calculateConfidence } from "@/lib/engine/confidence";
import { describe, expect, it } from "vitest";

describe("calculateConfidence", () => {
	it("returns 0 for empty evidence", () => {
		expect(calculateConfidence([])).toBe(0);
	});

	it("returns 30 for 1 quote from 1 neutral note", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		expect(calculateConfidence(evidence)).toBe(30);
	});

	it("returns 30 for 2 quotes from the SAME note (unique notes count)", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n1", emotionalTone: "neutral" },
		];
		expect(calculateConfidence(evidence)).toBe(30);
	});

	it("returns 60 for 3 quotes from 3 different neutral notes", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n2", emotionalTone: "neutral" },
			{ noteId: "n3", emotionalTone: "neutral" },
		];
		expect(calculateConfidence(evidence)).toBe(60);
	});

	it("returns 90 for 5 different neutral notes (capped)", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n2", emotionalTone: "neutral" },
			{ noteId: "n3", emotionalTone: "neutral" },
			{ noteId: "n4", emotionalTone: "neutral" },
			{ noteId: "n5", emotionalTone: "neutral" },
		];
		// 30 + 15*4 = 90
		expect(calculateConfidence(evidence)).toBe(90);
	});

	it("returns 90 for 6 different neutral notes (still capped)", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "neutral" },
			{ noteId: "n2", emotionalTone: "neutral" },
			{ noteId: "n3", emotionalTone: "neutral" },
			{ noteId: "n4", emotionalTone: "neutral" },
			{ noteId: "n5", emotionalTone: "neutral" },
			{ noteId: "n6", emotionalTone: "neutral" },
		];
		expect(calculateConfidence(evidence)).toBe(90);
	});

	it("returns 36 for 1 quote from 'frustrated' note", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "frustrated" }];
		expect(calculateConfidence(evidence)).toBe(36);
	});

	it("returns 36 for 1 quote from 'delighted' note", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "delighted" }];
		expect(calculateConfidence(evidence)).toBe(36);
	});

	it("returns 30 for 1 quote from 'neutral' note (no bonus)", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "neutral" }];
		expect(calculateConfidence(evidence)).toBe(30);
	});

	it("returns 30 for 1 quote from 'mixed' note (no bonus)", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: "mixed" }];
		expect(calculateConfidence(evidence)).toBe(30);
	});

	it("returns 30 for 1 quote from note with null tone (no bonus)", () => {
		const evidence: EvidenceInput[] = [{ noteId: "n1", emotionalTone: null }];
		expect(calculateConfidence(evidence)).toBe(30);
	});

	it("returns 54 for 2 quotes from 2 frustrated notes", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "frustrated" },
			{ noteId: "n2", emotionalTone: "frustrated" },
		];
		// 30*1.2 + 15*1.2 = 36 + 18 = 54
		expect(calculateConfidence(evidence)).toBe(54);
	});

	it("returns 90 (capped) for 3 frustrated + 2 neutral notes", () => {
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "frustrated" },
			{ noteId: "n2", emotionalTone: "frustrated" },
			{ noteId: "n3", emotionalTone: "frustrated" },
			{ noteId: "n4", emotionalTone: "neutral" },
			{ noteId: "n5", emotionalTone: "neutral" },
		];
		// 36 + 18 + 18 + 15 + 15 = 102 → capped at 90
		expect(calculateConfidence(evidence)).toBe(90);
	});

	it("score is always an integer (Math.round applied)", () => {
		// Single frustrated note gives 36 (integer), but let's verify rounding
		const evidence: EvidenceInput[] = [
			{ noteId: "n1", emotionalTone: "frustrated" },
			{ noteId: "n2", emotionalTone: "neutral" },
		];
		const score = calculateConfidence(evidence);
		expect(Number.isInteger(score)).toBe(true);
	});

	it("score never exceeds 90 even with extreme inputs", () => {
		const evidence: EvidenceInput[] = Array.from({ length: 20 }, (_, i) => ({
			noteId: `n${i}`,
			emotionalTone: "frustrated" as const,
		}));
		expect(calculateConfidence(evidence)).toBe(90);
	});
});
