import { createNoteSchema } from "@/lib/validations/vault";
import { describe, expect, it } from "vitest";

const TODAY = new Date().toISOString().split("T")[0];
const YESTERDAY = (() => {
	const d = new Date();
	d.setDate(d.getDate() - 1);
	return d.toISOString().split("T")[0];
})();
const TOMORROW = (() => {
	const d = new Date();
	d.setDate(d.getDate() + 1);
	return d.toISOString().split("T")[0];
})();

const VALID_MIN = {
	participantName: "Sarah Chen",
	sessionDate: TODAY,
	rawContent: "User mentioned they struggle with onboarding.",
};

describe("createNoteSchema", () => {
	// ── Valid inputs ──────────────────────────────────────────────────────────

	it("passes with minimum valid input", () => {
		expect(createNoteSchema.safeParse(VALID_MIN).success).toBe(true);
	});

	it("passes with all fields populated", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			researchMethod: "interview",
			userSegment: "Enterprise Admin",
			emotionalTone: "frustrated",
			assumptionsTested: "We assumed users knew how to export.",
			followUpNeeded: true,
			sessionRecordingUrl: "https://loom.com/share/abc123",
			tags: ["onboarding", "enterprise"],
		});
		expect(result.success).toBe(true);
	});

	// ── participantName ───────────────────────────────────────────────────────

	it("rejects empty participantName", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, participantName: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.participantName).toBeDefined();
		}
	});

	it("rejects whitespace-only participantName", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, participantName: "   " });
		expect(result.success).toBe(false);
	});

	it("rejects participantName over 200 characters", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			participantName: "A".repeat(201),
		});
		expect(result.success).toBe(false);
	});

	it("trims whitespace from participantName", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			participantName: "  Sarah Chen  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.participantName).toBe("Sarah Chen");
		}
	});

	// ── sessionDate ───────────────────────────────────────────────────────────

	it("rejects a future sessionDate", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, sessionDate: TOMORROW });
		expect(result.success).toBe(false);
	});

	it("accepts today as sessionDate", () => {
		expect(createNoteSchema.safeParse({ ...VALID_MIN, sessionDate: TODAY }).success).toBe(true);
	});

	it("accepts a past date", () => {
		expect(createNoteSchema.safeParse({ ...VALID_MIN, sessionDate: YESTERDAY }).success).toBe(true);
	});

	it("rejects an invalid date string", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, sessionDate: "not-a-date" });
		expect(result.success).toBe(false);
	});

	// ── rawContent ────────────────────────────────────────────────────────────

	it("rejects empty rawContent", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, rawContent: "" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.flatten().fieldErrors.rawContent).toBeDefined();
		}
	});

	// ── sessionRecordingUrl ───────────────────────────────────────────────────

	it("rejects an invalid URL in sessionRecordingUrl", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			sessionRecordingUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
	});

	it("accepts a valid https URL", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			sessionRecordingUrl: "https://loom.com/share/abc123",
		});
		expect(result.success).toBe(true);
	});

	it("transforms empty string sessionRecordingUrl to null", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			sessionRecordingUrl: "",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.sessionRecordingUrl).toBeNull();
		}
	});

	it("rejects javascript: protocol URL", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			sessionRecordingUrl: "javascript:alert(1)",
		});
		expect(result.success).toBe(false);
	});

	// ── tags ──────────────────────────────────────────────────────────────────

	it("rejects tags array with more than 20 items", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`),
		});
		expect(result.success).toBe(false);
	});

	it("rejects an individual tag over 50 characters", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			tags: ["A".repeat(51)],
		});
		expect(result.success).toBe(false);
	});

	it("accepts up to 20 tags", () => {
		const result = createNoteSchema.safeParse({
			...VALID_MIN,
			tags: Array.from({ length: 20 }, (_, i) => `tag-${i}`),
		});
		expect(result.success).toBe(true);
	});

	it("defaults tags to empty array when omitted", () => {
		const result = createNoteSchema.safeParse(VALID_MIN);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.tags).toEqual([]);
		}
	});

	// ── optional transforms ───────────────────────────────────────────────────

	it("transforms empty userSegment to null", () => {
		const result = createNoteSchema.safeParse({ ...VALID_MIN, userSegment: "" });
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.userSegment).toBeNull();
		}
	});

	it("defaults followUpNeeded to false when omitted", () => {
		const result = createNoteSchema.safeParse(VALID_MIN);
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.followUpNeeded).toBe(false);
		}
	});
});
