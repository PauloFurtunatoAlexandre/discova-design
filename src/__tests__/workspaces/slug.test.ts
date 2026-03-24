import { generateSlug } from "@/lib/utils/slug";
import { describe, expect, it } from "vitest";

describe("generateSlug", () => {
	it("generates a slug from a normal name", () => {
		const slug = generateSlug("Paulo's Workspace");
		expect(slug).toMatch(/^paulos-workspace-[a-z0-9]{4}$/);
	});

	it("generates a slug from a name with punctuation", () => {
		const slug = generateSlug("Acme Inc.");
		expect(slug).toMatch(/^acme-inc-[a-z0-9]{4}$/);
	});

	it("falls back to 'workspace' when name is empty", () => {
		const slug = generateSlug("");
		expect(slug).toMatch(/^workspace-[a-z0-9]{4}$/);
	});

	it("falls back to 'workspace' when name is all special chars", () => {
		const slug = generateSlug("@#$%");
		expect(slug).toMatch(/^workspace-[a-z0-9]{4}$/);
	});

	it("trims leading/trailing spaces", () => {
		const slug = generateSlug("  spaces  ");
		expect(slug).toMatch(/^spaces-[a-z0-9]{4}$/);
	});

	it("produces different slugs on two calls with the same name", () => {
		const a = generateSlug("Same Name");
		const b = generateSlug("Same Name");
		// Suffix is random — extremely unlikely to match
		expect(a).not.toBe(b);
	});

	it("result is all lowercase", () => {
		const slug = generateSlug("UPPER CASE NAME");
		expect(slug).toBe(slug.toLowerCase());
	});

	it("result contains no spaces", () => {
		const slug = generateSlug("Name With Spaces");
		expect(slug).not.toContain(" ");
	});
});
