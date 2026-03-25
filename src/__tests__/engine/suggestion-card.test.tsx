/**
 * Tests for SuggestionCard — the full interactive insight acceptance card.
 *
 * Server actions and fetch are mocked so tests run without a DB or network.
 */
import { SuggestionCard } from "@/components/engine/suggestion-card";
import type { AISuggestion } from "@/lib/engine/types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/actions/insights", () => ({
	acceptInsightAction: vi.fn(),
	linkInsightToProblemAction: vi.fn(),
	createProblemAndLinkAction: vi.fn(),
}));

// Framer Motion: disable animations in tests
vi.mock("framer-motion", async (importOriginal) => {
	const actual = await importOriginal<typeof import("framer-motion")>();
	return {
		...actual,
		AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
		motion: new Proxy(actual.motion, {
			get(target, prop: string) {
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				const MotionEl = (target as any)[prop];
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				return ({ children, ...props }: any) => {
					const { initial: _i, animate: _a, exit: _e, transition: _t, layout: _l, ...rest } = props;
					return <MotionEl {...rest}>{children}</MotionEl>;
				};
			},
		}),
		useReducedMotion: () => true,
	};
});

// Stub global fetch for problems API
beforeEach(() => {
	global.fetch = vi.fn().mockResolvedValue({
		ok: true,
		json: async () => [],
	});
});

afterEach(() => {
	vi.clearAllMocks();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeSuggestion = (overrides: Partial<AISuggestion> = {}): AISuggestion => ({
	id: "suggestion-1",
	statement: "Users struggle to complete the onboarding flow",
	supportingEvidence: [{ quoteText: "I got lost on step 3", startOffset: 10, endOffset: 30 }],
	suggestedThemeTag: "onboarding",
	confidence: "high",
	...overrides,
});

const defaultProps = {
	noteId: "note-uuid",
	workspaceId: "ws-uuid",
	projectId: "proj-uuid",
	index: 0,
	onAccepted: vi.fn(),
	onDismissed: vi.fn(),
};

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("SuggestionCard", () => {
	it("renders statement, evidence, theme tag, and confidence badge", () => {
		const suggestion = makeSuggestion();
		render(<SuggestionCard suggestion={suggestion} {...defaultProps} />);

		expect(screen.getByText("Users struggle to complete the onboarding flow")).toBeInTheDocument();
		expect(screen.getByText("I got lost on step 3")).toBeInTheDocument();
		expect(screen.getByText("onboarding")).toBeInTheDocument();
		expect(screen.getByText("high confidence")).toBeInTheDocument();
	});

	it("shows Accept, Edit, and Dismiss buttons in viewing mode", () => {
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /edit/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /dismiss/i })).toBeInTheDocument();
	});

	it("clicking Edit switches statement to a textarea", async () => {
		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /edit/i }));

		const textarea = screen.getByRole("textbox", { name: /insight statement/i });
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue("Users struggle to complete the onboarding flow");
	});

	it("editing statement and clicking Cancel reverts to original text", async () => {
		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /edit/i }));
		const textarea = screen.getByRole("textbox", { name: /insight statement/i });
		await user.clear(textarea);
		await user.type(textarea, "Modified statement");

		await user.click(screen.getByRole("button", { name: /cancel/i }));

		expect(screen.getByText("Users struggle to complete the onboarding flow")).toBeInTheDocument();
		expect(screen.queryByRole("textbox", { name: /insight statement/i })).not.toBeInTheDocument();
	});

	it("Save & Accept uses the edited text when accepting", async () => {
		const { acceptInsightAction } = await import("@/actions/insights");
		vi.mocked(acceptInsightAction).mockResolvedValue({
			success: true,
			insightId: "new-insight-id",
		});

		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /edit/i }));
		const textarea = screen.getByRole("textbox", { name: /insight statement/i });
		// fireEvent.change is the most reliable way to update a controlled textarea value
		fireEvent.change(textarea, { target: { value: "Edited insight statement" } });
		await user.click(screen.getByRole("button", { name: /save & accept/i }));

		await waitFor(() => {
			expect(acceptInsightAction).toHaveBeenCalledWith(
				expect.objectContaining({ statement: "Edited insight statement" }),
			);
		});
	});

	it("clicking Accept calls acceptInsightAction and shows linker", async () => {
		const { acceptInsightAction } = await import("@/actions/insights");
		vi.mocked(acceptInsightAction).mockResolvedValue({
			success: true,
			insightId: "new-insight-id",
		});

		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /^accept$/i }));

		await waitFor(() => {
			expect(acceptInsightAction).toHaveBeenCalledOnce();
			expect(screen.getByText(/which problem does this relate to/i)).toBeInTheDocument();
		});
	});

	it("clicking Skip in the linker transitions to accepted state", async () => {
		const { acceptInsightAction } = await import("@/actions/insights");
		vi.mocked(acceptInsightAction).mockResolvedValue({
			success: true,
			insightId: "new-insight-id",
		});

		const user = userEvent.setup();
		const onAccepted = vi.fn();
		render(
			<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} onAccepted={onAccepted} />,
		);

		await user.click(screen.getByRole("button", { name: /^accept$/i }));
		await waitFor(() =>
			expect(screen.getByText(/which problem does this relate to/i)).toBeInTheDocument(),
		);

		await user.click(screen.getByRole("button", { name: /skip/i }));

		await waitFor(() => {
			expect(screen.getByText(/insight created/i)).toBeInTheDocument();
			expect(onAccepted).toHaveBeenCalledWith("new-insight-id");
		});
	});

	it("clicking Dismiss hides the card and shows undo toast", async () => {
		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /dismiss/i }));

		await waitFor(() => {
			expect(screen.getByText(/suggestion dismissed/i)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument();
		});
		// Card statement is no longer visible
		expect(
			screen.queryByText("Users struggle to complete the onboarding flow"),
		).not.toBeInTheDocument();
	});

	it("clicking Undo after Dismiss restores the card", async () => {
		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /dismiss/i }));
		await waitFor(() => expect(screen.getByRole("button", { name: /undo/i })).toBeInTheDocument());

		await user.click(screen.getByRole("button", { name: /undo/i }));

		await waitFor(() => {
			expect(
				screen.getByText("Users struggle to complete the onboarding flow"),
			).toBeInTheDocument();
		});
	});

	it("accepted card shows 'Insight created' and AI attribution", async () => {
		const { acceptInsightAction } = await import("@/actions/insights");
		vi.mocked(acceptInsightAction).mockResolvedValue({
			success: true,
			insightId: "new-insight-id",
		});

		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /^accept$/i }));
		await waitFor(() =>
			expect(screen.getByText(/which problem does this relate to/i)).toBeInTheDocument(),
		);
		await user.click(screen.getByRole("button", { name: /skip/i }));

		await waitFor(() => {
			expect(screen.getByText(/insight created/i)).toBeInTheDocument();
			expect(screen.getByText(/ai · accepted/i)).toBeInTheDocument();
		});
	});

	it("accepted card shows linked problem label when connected", async () => {
		const { acceptInsightAction, linkInsightToProblemAction } = await import("@/actions/insights");
		vi.mocked(acceptInsightAction).mockResolvedValue({
			success: true,
			insightId: "new-insight-id",
		});
		vi.mocked(linkInsightToProblemAction).mockResolvedValue({
			success: true,
			insightNodeId: "insight-node-id",
		});

		// Stub fetch to return one problem
		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => [
				{
					id: "problem-1",
					label: "Onboarding friction",
					description: null,
					connectedInsightCount: 2,
				},
			],
		});

		const user = userEvent.setup();
		render(<SuggestionCard suggestion={makeSuggestion()} {...defaultProps} />);

		await user.click(screen.getByRole("button", { name: /^accept$/i }));
		await waitFor(() => expect(screen.getByText("Onboarding friction")).toBeInTheDocument());

		await user.click(screen.getByText("Onboarding friction"));

		await waitFor(() => {
			expect(screen.getByText(/linked to: onboarding friction/i)).toBeInTheDocument();
		});
	});
});
