import { buildSystemPrompt, buildUserPrompt } from "@/lib/engine/prompts";
import { describe, expect, it } from "vitest";

describe("buildSystemPrompt", () => {
	it("returns a non-empty string", () => {
		expect(buildSystemPrompt().length).toBeGreaterThan(0);
	});

	it("contains 'JSON array' instruction", () => {
		expect(buildSystemPrompt()).toContain("JSON array");
	});

	it("defines confidence levels", () => {
		const prompt = buildSystemPrompt();
		expect(prompt).toContain("high");
		expect(prompt).toContain("medium");
		expect(prompt).toContain("low");
	});
});

describe("buildUserPrompt", () => {
	const base = {
		noteContent: "The user struggled with onboarding.",
		participantName: "Alice Smith",
		sessionDate: "2026-03-24",
		researchMethod: "interview" as const,
		existingQuotes: [] as Array<{ text: string; startOffset: number; endOffset: number }>,
		existingProblems: [] as Array<{ label: string }>,
	};

	it("includes participant name", () => {
		const result = buildUserPrompt(base);
		expect(result).toContain("Alice Smith");
	});

	it("includes note content", () => {
		const result = buildUserPrompt(base);
		expect(result).toContain("The user struggled with onboarding.");
	});

	it("includes session date", () => {
		const result = buildUserPrompt(base);
		expect(result).toContain("2026-03-24");
	});

	it("includes existing quotes when provided", () => {
		const result = buildUserPrompt({
			...base,
			existingQuotes: [{ text: "I got lost", startOffset: 0, endOffset: 10 }],
		});
		expect(result).toContain("I got lost");
		expect(result).toContain("ALREADY EXTRACTED QUOTES");
	});

	it("includes existing problems when provided", () => {
		const result = buildUserPrompt({
			...base,
			existingProblems: [{ label: "Onboarding friction" }],
		});
		expect(result).toContain("Onboarding friction");
		expect(result).toContain("EXISTING PROBLEMS");
	});

	it("excludes quotes section when no quotes exist", () => {
		const result = buildUserPrompt(base);
		expect(result).not.toContain("ALREADY EXTRACTED QUOTES");
	});

	it("excludes problems section when no problems exist", () => {
		const result = buildUserPrompt(base);
		expect(result).not.toContain("EXISTING PROBLEMS");
	});

	it("omits method line when researchMethod is null", () => {
		const result = buildUserPrompt({ ...base, researchMethod: null });
		expect(result).not.toContain("Method:");
	});

	it("includes method when provided", () => {
		const result = buildUserPrompt({ ...base, researchMethod: "survey" });
		expect(result).toContain("Method: survey");
	});
});
