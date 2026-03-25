/**
 * Tests for InsightCard — compact, full, and inline variants.
 */
import { InsightCard } from "@/components/engine/insight-card";
import type { InsightWithRelations } from "@/lib/queries/engine";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock("@/actions/insights", () => ({
	updateInsightAction: vi.fn(),
	deleteInsightAction: vi.fn(),
	acceptInsightAction: vi.fn(),
	linkInsightToProblemAction: vi.fn(),
	createProblemAndLinkAction: vi.fn(),
	createManualInsightAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

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
					const {
						initial: _i,
						animate: _a,
						exit: _e,
						transition: _t,
						layout: _l,
						whileHover: _wh,
						...rest
					} = props;
					return <MotionEl {...rest}>{children}</MotionEl>;
				};
			},
		}),
		useReducedMotion: () => true,
		animate: vi.fn(),
		useMotionValue: (v: number) => ({ get: () => v, set: vi.fn() }),
		useTransform: (_mv: unknown, fn: (v: number) => string) => ({ get: () => fn(0) }),
	};
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const makeInsight = (overrides: Partial<InsightWithRelations> = {}): InsightWithRelations => ({
	id: "insight-1",
	statement: "Users find the onboarding flow confusing after step 3",
	confidenceScore: 72,
	themeTag: "onboarding",
	isAiGenerated: false,
	createdBy: { id: "user-1", name: "Sarah Chen" },
	acceptedBy: null,
	createdAt: new Date("2026-01-01T12:00:00Z"),
	updatedAt: new Date("2026-01-01T12:00:00Z"),
	evidence: [],
	evidenceCount: 4,
	linkedProblem: { nodeId: "prob-1", label: "Onboarding friction" },
	isConnectedToMap: true,
	...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("InsightCard — compact variant", () => {
	it("renders statement, theme tag, and evidence count", () => {
		render(
			<InsightCard
				insight={makeInsight()}
				variant="compact"
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);

		expect(
			screen.getByText("Users find the onboarding flow confusing after step 3"),
		).toBeInTheDocument();
		expect(screen.getByText("onboarding")).toBeInTheDocument();
		expect(screen.getByText(/4 evidence/i)).toBeInTheDocument();
	});

	it("shows connected problem label in compact view", () => {
		render(
			<InsightCard
				insight={makeInsight()}
				variant="compact"
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(screen.getByText(/onboarding friction/i)).toBeInTheDocument();
	});

	it("unconnected insight shows 'Unconnected' badge and dashed border style", () => {
		const { container } = render(
			<InsightCard
				insight={makeInsight({ isConnectedToMap: false, linkedProblem: null })}
				variant="compact"
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);

		expect(screen.getByText("Unconnected")).toBeInTheDocument();
		// Border style is inline — use getAttribute to handle CSS variables in shorthand
		const card = container.firstChild as HTMLElement;
		expect(card?.getAttribute("style")).toContain("dashed");
	});

	it("manual insight shows '{name} · {timeAgo}' attribution (no AI prefix)", () => {
		render(
			<InsightCard
				insight={makeInsight({ isAiGenerated: false })}
				variant="compact"
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(screen.getByText(/Sarah Chen/)).toBeInTheDocument();
		// Should NOT show "AI ·"
		expect(screen.queryByText(/ai · accepted by/i)).not.toBeInTheDocument();
	});

	it("AI insight shows 'AI · Accepted by' attribution", () => {
		render(
			<InsightCard
				insight={makeInsight({
					isAiGenerated: true,
					acceptedBy: { id: "user-1", name: "Sarah Chen" },
				})}
				variant="compact"
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(screen.getByText(/ai · accepted by sarah chen/i)).toBeInTheDocument();
	});

	it("click fires onClick callback", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(
			<InsightCard
				insight={makeInsight()}
				variant="compact"
				onClick={onClick}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);

		await user.click(screen.getByText("Users find the onboarding flow confusing after step 3"));
		expect(onClick).toHaveBeenCalledOnce();
	});
});

describe("InsightCard — full variant", () => {
	it("renders statement without line-clamp truncation", () => {
		render(
			<InsightCard
				insight={makeInsight()}
				variant="full"
				canEdit={false}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(
			screen.getByText("Users find the onboarding flow confusing after step 3"),
		).toBeInTheDocument();
	});

	it("shows edit and delete buttons when canEdit=true", () => {
		render(
			<InsightCard
				insight={makeInsight()}
				variant="full"
				canEdit={true}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(screen.getByRole("button", { name: /edit insight/i })).toBeInTheDocument();
		expect(screen.getByRole("button", { name: /delete insight/i })).toBeInTheDocument();
	});

	it("hides edit/delete buttons when canEdit=false", () => {
		render(
			<InsightCard
				insight={makeInsight()}
				variant="full"
				canEdit={false}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		expect(screen.queryByRole("button", { name: /edit insight/i })).not.toBeInTheDocument();
		expect(screen.queryByRole("button", { name: /delete insight/i })).not.toBeInTheDocument();
	});

	it("clicking Edit shows statement textarea", async () => {
		const user = userEvent.setup();
		render(
			<InsightCard
				insight={makeInsight()}
				variant="full"
				canEdit={true}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);

		await user.click(screen.getByRole("button", { name: /edit insight/i }));
		const textarea = screen.getByRole("textbox", { name: /insight statement/i });
		expect(textarea).toBeInTheDocument();
		expect(textarea).toHaveValue("Users find the onboarding flow confusing after step 3");
	});

	it("shows evidence list when evidence is provided", () => {
		const insight = makeInsight({
			evidence: [
				{
					quoteId: "q-1",
					quoteText: "I got lost on step 3",
					noteId: "note-1",
					participantName: "Alice",
					sessionDate: "2026-01-01",
					isStale: false,
				},
			],
			evidenceCount: 1,
		});
		render(
			<InsightCard
				insight={insight}
				variant="full"
				canEdit={false}
				workspaceId="ws-1"
				projectId="proj-1"
			/>,
		);
		// Evidence toggle button shows count
		expect(screen.getByText(/1 evidence link/i)).toBeInTheDocument();
	});
});

describe("InsightCard — inline variant", () => {
	it("renders statement and evidence count (minimal)", () => {
		render(<InsightCard insight={makeInsight()} variant="inline" />);

		expect(
			screen.getByText("Users find the onboarding flow confusing after step 3"),
		).toBeInTheDocument();
		expect(screen.getByText(/4 evidence/i)).toBeInTheDocument();
	});

	it("does not render action buttons in inline variant", () => {
		render(<InsightCard insight={makeInsight()} variant="inline" canEdit={true} />);
		expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
	});
});
