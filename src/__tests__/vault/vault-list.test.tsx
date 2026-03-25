/**
 * Vault list view component tests.
 *
 * Tests cover: NoteCard rendering, VaultEmptyState, VaultList,
 * and interaction behaviour. DB and fetch calls are mocked.
 */

import { NoteCard } from "@/components/vault/note-card";
import { VaultEmptyState } from "@/components/vault/vault-empty-state";
import { VaultList } from "@/components/vault/vault-list";
import type { NoteListItem } from "@/lib/queries/vault-list";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mocks ──────────────────────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			...props
		}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
			<div {...props}>{children}</div>
		),
	},
}));

// ── Fixtures ───────────────────────────────────────────────────────────────────

function makeNote(overrides: Partial<NoteListItem> = {}): NoteListItem {
	return {
		id: "note-abc",
		participantName: "Sarah Chen",
		sessionDate: "2026-03-24",
		rawContentPreview:
			"The user mentioned that the onboarding flow was confusing, particularly the third step.",
		researchMethod: "interview",
		emotionalTone: "frustrated",
		followUpNeeded: false,
		quoteCount: 3,
		insightCount: 1,
		createdAt: new Date("2026-03-24T10:00:00Z"),
		tags: ["onboarding", "mobile"],
		...overrides,
	};
}

const WORKSPACE = "ws-1";
const PROJECT = "proj-1";

// ── NoteCard tests ─────────────────────────────────────────────────────────────

describe("NoteCard", () => {
	it("renders participant name", () => {
		render(<NoteCard note={makeNote()} workspaceId={WORKSPACE} projectId={PROJECT} />);
		expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
	});

	it("renders formatted date", () => {
		render(<NoteCard note={makeNote()} workspaceId={WORKSPACE} projectId={PROJECT} />);
		// Mar 24, 2026 — formatted via toLocaleDateString
		expect(screen.getByText(/Mar 24, 2026/i)).toBeInTheDocument();
	});

	it("renders content preview", () => {
		render(<NoteCard note={makeNote()} workspaceId={WORKSPACE} projectId={PROJECT} />);
		expect(screen.getByText(/onboarding flow was confusing/)).toBeInTheDocument();
	});

	it("renders quote count badge when > 0", () => {
		render(
			<NoteCard note={makeNote({ quoteCount: 3 })} workspaceId={WORKSPACE} projectId={PROJECT} />,
		);
		expect(screen.getByText("3")).toBeInTheDocument();
	});

	it("does not render quote count badge when 0", () => {
		render(
			<NoteCard note={makeNote({ quoteCount: 0 })} workspaceId={WORKSPACE} projectId={PROJECT} />,
		);
		// Should not find a "0" badge in the metadata row
		const allText = screen.queryAllByText("0");
		// The number "0" should not appear as a standalone badge
		expect(allText.filter((el) => el.textContent === "0")).toHaveLength(0);
	});

	it("renders research method badge", () => {
		render(
			<NoteCard
				note={makeNote({ researchMethod: "interview" })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.getByText("Interview")).toBeInTheDocument();
	});

	it("does not render method badge when null", () => {
		render(
			<NoteCard
				note={makeNote({ researchMethod: null })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.queryByText("Interview")).not.toBeInTheDocument();
	});

	it("renders emotional tone indicator", () => {
		render(
			<NoteCard
				note={makeNote({ emotionalTone: "frustrated" })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.getByText("Frustrated")).toBeInTheDocument();
	});

	it("does not render tone indicator when null", () => {
		render(
			<NoteCard
				note={makeNote({ emotionalTone: null })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.queryByText("Frustrated")).not.toBeInTheDocument();
		expect(screen.queryByText("Delighted")).not.toBeInTheDocument();
	});

	it("renders follow-up flag when set", () => {
		render(
			<NoteCard
				note={makeNote({ followUpNeeded: true })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.getByText("Follow-up")).toBeInTheDocument();
	});

	it("does not render follow-up flag when false", () => {
		render(
			<NoteCard
				note={makeNote({ followUpNeeded: false })}
				workspaceId={WORKSPACE}
				projectId={PROJECT}
			/>,
		);
		expect(screen.queryByText("Follow-up")).not.toBeInTheDocument();
	});

	it("renders insight count badge when > 0", () => {
		render(
			<NoteCard note={makeNote({ insightCount: 2 })} workspaceId={WORKSPACE} projectId={PROJECT} />,
		);
		expect(screen.getByText("2")).toBeInTheDocument();
	});

	it("navigates to correct URL on click", async () => {
		const pushMock = vi.fn();
		vi.mocked(require("next/navigation").useRouter).mockReturnValue({ push: pushMock });

		render(<NoteCard note={makeNote()} workspaceId={WORKSPACE} projectId={PROJECT} />);
		await userEvent.click(screen.getByRole("button"));
		expect(pushMock).toHaveBeenCalledWith(`/${WORKSPACE}/${PROJECT}/vault/note-abc`);
	});

	it("renders first 3 tags, collapses extras", () => {
		const note = makeNote({ tags: ["a", "b", "c", "d", "e"] });
		render(<NoteCard note={note} workspaceId={WORKSPACE} projectId={PROJECT} />);
		expect(screen.getByText("a")).toBeInTheDocument();
		expect(screen.getByText("b")).toBeInTheDocument();
		expect(screen.getByText("c")).toBeInTheDocument();
		expect(screen.getByText("+2")).toBeInTheDocument();
		expect(screen.queryByText("d")).not.toBeInTheDocument();
	});
});

// ── VaultEmptyState tests ──────────────────────────────────────────────────────

describe("VaultEmptyState — project empty", () => {
	it("shows researcher-specific copy for researcher preset", () => {
		render(
			<VaultEmptyState preset="researcher" workspaceId={WORKSPACE} projectId={PROJECT} canEdit />,
		);
		expect(screen.getByText("Start with an interview note")).toBeInTheDocument();
	});

	it("shows PM-specific copy for pm preset", () => {
		render(<VaultEmptyState preset="pm" workspaceId={WORKSPACE} projectId={PROJECT} canEdit />);
		expect(screen.getByText("Paste in your last user feedback")).toBeInTheDocument();
	});

	it("shows generic copy for member preset", () => {
		render(<VaultEmptyState preset="member" workspaceId={WORKSPACE} projectId={PROJECT} canEdit />);
		expect(screen.getByText("Your research vault is empty")).toBeInTheDocument();
	});

	it("hides CTA when canEdit is false", () => {
		render(
			<VaultEmptyState
				preset="researcher"
				workspaceId={WORKSPACE}
				projectId={PROJECT}
				canEdit={false}
			/>,
		);
		expect(screen.queryByRole("button")).not.toBeInTheDocument();
	});
});

describe("VaultEmptyState — no results", () => {
	it("shows 'No notes match your filters' copy", () => {
		render(
			<VaultEmptyState
				preset="member"
				workspaceId={WORKSPACE}
				projectId={PROJECT}
				canEdit
				noResults
				onClearFilters={vi.fn()}
			/>,
		);
		expect(screen.getByText("No notes match your filters")).toBeInTheDocument();
	});

	it("shows 'Clear all filters' button", () => {
		render(
			<VaultEmptyState
				preset="member"
				workspaceId={WORKSPACE}
				projectId={PROJECT}
				canEdit
				noResults
				onClearFilters={vi.fn()}
			/>,
		);
		expect(screen.getByRole("button", { name: /clear all filters/i })).toBeInTheDocument();
	});

	it("calls onClearFilters when button is clicked", async () => {
		const onClear = vi.fn();
		render(
			<VaultEmptyState
				preset="member"
				workspaceId={WORKSPACE}
				projectId={PROJECT}
				canEdit
				noResults
				onClearFilters={onClear}
			/>,
		);
		await userEvent.click(screen.getByRole("button", { name: /clear all filters/i }));
		expect(onClear).toHaveBeenCalledOnce();
	});
});

// ── VaultList tests ────────────────────────────────────────────────────────────

describe("VaultList", () => {
	const baseProps = {
		workspaceId: WORKSPACE,
		projectId: PROJECT,
		hasMore: false,
		isLoading: false,
		onLoadMore: vi.fn(),
		totalCount: 3,
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders total count in header", () => {
		render(
			<VaultList
				{...baseProps}
				notes={[makeNote(), makeNote({ id: "n2" }), makeNote({ id: "n3" })]}
			/>,
		);
		expect(screen.getByText("3 research notes")).toBeInTheDocument();
	});

	it("uses singular for 1 note", () => {
		render(<VaultList {...baseProps} notes={[makeNote()]} totalCount={1} />);
		expect(screen.getByText("1 research note")).toBeInTheDocument();
	});

	it("shows 'Load more' button when hasMore is true", () => {
		render(<VaultList {...baseProps} hasMore notes={[makeNote()]} />);
		expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();
	});

	it("hides 'Load more' button when hasMore is false", () => {
		render(<VaultList {...baseProps} hasMore={false} notes={[makeNote()]} />);
		expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
	});

	it("calls onLoadMore when 'Load more' is clicked", async () => {
		const onLoadMore = vi.fn();
		render(<VaultList {...baseProps} hasMore notes={[makeNote()]} onLoadMore={onLoadMore} />);
		await userEvent.click(screen.getByRole("button", { name: /load more/i }));
		expect(onLoadMore).toHaveBeenCalledOnce();
	});

	it("shows 'All notes loaded' when hasMore is false and notes exist", () => {
		render(<VaultList {...baseProps} notes={[makeNote()]} />);
		expect(screen.getByText("All notes loaded")).toBeInTheDocument();
	});
});
