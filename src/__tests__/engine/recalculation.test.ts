/**
 * Confidence recalculation tests.
 *
 * The pure calculation logic is covered in confidence.test.ts.
 * These tests document the integration behavior of recalculateConfidence
 * and batchRecalculateForNote server actions (require DB).
 */

import { describe, it } from "vitest";

describe.skip("recalculateConfidence (requires DB)", () => {
	it("returns correct score and persists to DB");
	it("adding evidence to insight increases score");
	it("removing evidence decreases score");
	it("returns 0 for insight with no evidence");
	it("score never exceeds 90 after recalculation");
});

describe.skip("batchRecalculateForNote (requires DB)", () => {
	it("updates all insights linked to quotes from a given note");
	it("changing note emotional tone from neutral to frustrated increases affected scores");
	it("changing note emotional tone from frustrated to neutral decreases affected scores");
});

describe.skip("recalculation triggers (integration, requires DB)", () => {
	it("acceptInsightAction triggers recalculation");
	it("createManualInsightAction triggers recalculation");
	it("deleteQuoteAction triggers recalculation for affected insights");
	it("updateNoteMetadataAction with emotionalTone triggers batchRecalculateForNote");
});
