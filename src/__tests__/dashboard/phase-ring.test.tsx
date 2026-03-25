import { PhaseRing } from "@/components/dashboard/phase-ring";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
	useRouter: vi.fn(() => ({ push: mockPush })),
	usePathname: vi.fn(() => "/"),
}));

// Suppress framer-motion animation warnings in test env
vi.mock("framer-motion", async () => {
	const actual = await vi.importActual<typeof import("framer-motion")>("framer-motion");
	return {
		...actual,
		useReducedMotion: vi.fn(() => true), // always reduced motion in tests
		animate: vi.fn(() => ({ stop: vi.fn() })),
	};
});

const DEFAULT_PROPS = {
	label: "Vault",
	percentage: 60,
	completed: 3,
	total: 5,
	color: "#E8C547",
	glowColor: "",
	href: "/ws1/proj1/vault",
	index: 0,
};

describe("PhaseRing", () => {
	beforeEach(() => {
		mockPush.mockClear();
	});

	it("renders the label", () => {
		render(<PhaseRing {...DEFAULT_PROPS} />);
		expect(screen.getByText("Vault")).toBeInTheDocument();
	});

	it("renders completed / total count", () => {
		render(<PhaseRing {...DEFAULT_PROPS} />);
		expect(screen.getByText("3 / 5")).toBeInTheDocument();
	});

	it("shows 'No data yet' when total is 0", () => {
		render(<PhaseRing {...DEFAULT_PROPS} percentage={0} completed={0} total={0} />);
		expect(screen.getByText("No data yet")).toBeInTheDocument();
	});

	it("shows percentage in centre text (reduced motion)", () => {
		render(<PhaseRing {...DEFAULT_PROPS} />);
		expect(screen.getByText("60%")).toBeInTheDocument();
	});

	it("navigates to href on click", async () => {
		const user = userEvent.setup();
		render(<PhaseRing {...DEFAULT_PROPS} />);
		await user.click(screen.getByRole("button", { name: /vault/i }));
		expect(mockPush).toHaveBeenCalledWith("/ws1/proj1/vault");
	});

	it("has accessible aria-label with full context", () => {
		render(<PhaseRing {...DEFAULT_PROPS} />);
		const btn = screen.getByRole("button");
		expect(btn).toHaveAttribute("aria-label", expect.stringContaining("60%"));
		expect(btn).toHaveAttribute("aria-label", expect.stringContaining("3 of 5"));
	});
});
