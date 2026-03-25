/**
 * Tests for ConfidenceRing SVG component.
 */
import { ConfidenceRing } from "@/components/engine/confidence-ring";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Disable framer-motion animations in tests
vi.mock("framer-motion", async (importOriginal) => {
	const actual = await importOriginal<typeof import("framer-motion")>();
	return {
		...actual,
		motion: new Proxy(actual.motion, {
			get(target, prop: string) {
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				const MotionEl = (target as any)[prop];
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				return ({ children, ...props }: any) => {
					const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
					return <MotionEl {...rest}>{children}</MotionEl>;
				};
			},
		}),
		useReducedMotion: () => true,
		animate: vi.fn(),
		useMotionValue: (initial: number) => ({
			get: () => initial,
			set: vi.fn(),
		}),
		useTransform: (_mv: unknown, fn: (v: number) => string) => ({
			get: () => fn(0),
		}),
	};
});

describe("ConfidenceRing", () => {
	it("renders with aria-label showing score", () => {
		render(<ConfidenceRing score={72} />);
		expect(screen.getByRole("img", { name: /confidence: 72%/i })).toBeInTheDocument();
	});

	it("caps score at 90 visually", () => {
		render(<ConfidenceRing score={95} />);
		// aria-label should show 90, not 95
		expect(screen.getByRole("img", { name: /confidence: 90%/i })).toBeInTheDocument();
	});

	it("renders 0% as empty ring (score 0)", () => {
		render(<ConfidenceRing score={0} />);
		expect(screen.getByRole("img", { name: /confidence: 0%/i })).toBeInTheDocument();
	});

	it("score 0–29 uses error color (data-score-range=low)", () => {
		const { container } = render(<ConfidenceRing score={15} />);
		const ring = container.querySelector("[data-testid='confidence-ring']");
		expect(ring).toHaveAttribute("data-score-range", "low");
	});

	it("score 30–59 uses warning color (data-score-range=medium)", () => {
		const { container } = render(<ConfidenceRing score={45} />);
		const ring = container.querySelector("[data-testid='confidence-ring']");
		expect(ring).toHaveAttribute("data-score-range", "medium");
	});

	it("score 60–90 uses success color (data-score-range=high)", () => {
		const { container } = render(<ConfidenceRing score={75} />);
		const ring = container.querySelector("[data-testid='confidence-ring']");
		expect(ring).toHaveAttribute("data-score-range", "high");
	});

	it("size 'sm' renders SVG at 32×32", () => {
		const { container } = render(<ConfidenceRing score={50} size="sm" />);
		const svg = container.querySelector("svg");
		expect(svg).toHaveAttribute("width", "32");
		expect(svg).toHaveAttribute("height", "32");
	});

	it("size 'md' renders SVG at 56×56", () => {
		const { container } = render(<ConfidenceRing score={50} size="md" />);
		const svg = container.querySelector("svg");
		expect(svg).toHaveAttribute("width", "56");
		expect(svg).toHaveAttribute("height", "56");
	});

	it("size 'lg' renders SVG at 80×80", () => {
		const { container } = render(<ConfidenceRing score={50} size="lg" />);
		const svg = container.querySelector("svg");
		expect(svg).toHaveAttribute("width", "80");
		expect(svg).toHaveAttribute("height", "80");
	});

	it("shows 'Low' label for score < 30 (md size)", () => {
		render(<ConfidenceRing score={10} size="md" />);
		expect(screen.getByText("Low")).toBeInTheDocument();
	});

	it("shows 'Medium' label for score 30–59 (md size)", () => {
		render(<ConfidenceRing score={50} size="md" />);
		expect(screen.getByText("Medium")).toBeInTheDocument();
	});

	it("shows 'High' label for score 60–90 (md size)", () => {
		render(<ConfidenceRing score={72} size="md" />);
		expect(screen.getByText("High")).toBeInTheDocument();
	});

	it("does not show label for 'sm' size", () => {
		render(<ConfidenceRing score={72} size="sm" />);
		expect(screen.queryByText("High")).not.toBeInTheDocument();
	});

	it("shows tooltip on hover for score >= 90", () => {
		const { container } = render(<ConfidenceRing score={90} />);
		const ring = container.querySelector("[data-testid='confidence-ring']");
		expect(ring).toHaveAttribute(
			"title",
			"Confidence is capped at 90%. Research supports but never proves.",
		);
	});

	it("does not show tooltip for score < 90", () => {
		const { container } = render(<ConfidenceRing score={72} />);
		const ring = container.querySelector("[data-testid='confidence-ring']");
		expect(ring).not.toHaveAttribute("title");
	});
});
