import { Sidebar } from "@/components/layout/sidebar";
import { SidebarProvider } from "@/hooks/useSidebar";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
	usePathname: vi.fn().mockReturnValue("/"),
	useRouter: vi.fn().mockReturnValue({ push: vi.fn() }),
}));

// Mock Next.js Link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		className,
		style,
		"aria-current": ariaCurrent,
		"data-active": dataActive,
		...props
	}: {
		children: React.ReactNode;
		href: string;
		className?: string;
		style?: React.CSSProperties;
		"aria-current"?: React.AriaAttributes["aria-current"];
		"data-active"?: boolean;
		[key: string]: unknown;
	}) => (
		<a
			href={href}
			className={className}
			style={style}
			aria-current={ariaCurrent}
			data-active={dataActive}
			{...props}
		>
			{children}
		</a>
	),
}));

// Mock Framer Motion — strip animation-only props to avoid React DOM warnings
function stripMotionProps(props: Record<string, unknown>) {
	const {
		layoutId: _lid,
		initial: _i,
		animate: _a,
		exit: _e,
		variants: _v,
		transition: _t,
		...rest
	} = props;
	return rest;
}

vi.mock("framer-motion", () => ({
	motion: {
		div: ({
			children,
			...props
		}: {
			children?: React.ReactNode;
			[key: string]: unknown;
		}) => <div {...stripMotionProps(props)}>{children}</div>,
		ul: ({
			children,
			...props
		}: {
			children?: React.ReactNode;
			[key: string]: unknown;
		}) => <ul {...stripMotionProps(props)}>{children}</ul>,
		li: ({
			children,
			...props
		}: {
			children?: React.ReactNode;
			[key: string]: unknown;
		}) => <li {...stripMotionProps(props)}>{children}</li>,
	},
	AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
	useReducedMotion: vi.fn().mockReturnValue(false),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
	signOut: vi.fn(),
}));

// Mock useTheme
vi.mock("@/hooks/useTheme", () => ({
	useTheme: vi.fn().mockReturnValue({
		theme: "dark",
		setTheme: vi.fn(),
		resolvedTheme: "dark",
		toggleTheme: vi.fn(),
	}),
	ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { usePathname } from "next/navigation";

const mockWorkspace = {
	id: "ws-1",
	name: "Acme Corp",
	slug: "acme",
	logoUrl: null,
};

const mockProjects = [
	{ id: "proj-1", name: "Project Alpha", slug: "alpha" },
	{ id: "proj-2", name: "Project Beta", slug: "beta" },
];

const mockUser = {
	id: "user-1",
	name: "Alice Smith",
	email: "alice@example.com",
	image: null,
};

function renderSidebar(
	overrides: {
		projects?: typeof mockProjects;
		userTier?: string;
	} = {},
) {
	return render(
		<SidebarProvider>
			<Sidebar
				workspace={mockWorkspace}
				allWorkspaces={[{ ...mockWorkspace, isDemo: false, tier: "admin" }]}
				projects={overrides.projects ?? mockProjects}
				user={mockUser}
				userTier={overrides.userTier ?? "member"}
			/>
		</SidebarProvider>,
	);
}

describe("Sidebar", () => {
	beforeEach(() => {
		vi.mocked(usePathname).mockReturnValue("/");
	});

	it("renders workspace name in header", () => {
		renderSidebar();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("shows project list when workspace has projects", () => {
		renderSidebar();
		expect(screen.getByText("Project Alpha")).toBeInTheDocument();
		expect(screen.getByText("Project Beta")).toBeInTheDocument();
	});

	it("highlights active project with aria-current", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1/vault");
		renderSidebar();

		const activeLink = screen.getByRole("link", { name: /Project Alpha/i });
		expect(activeLink).toHaveAttribute("aria-current", "page");
	});

	it("shows 'No projects' message when list is empty", () => {
		renderSidebar({ projects: [] });
		expect(screen.getByText("No projects yet")).toBeInTheDocument();
	});

	it("phase nav appears when project is in URL", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1/vault");
		renderSidebar();

		expect(screen.getByText("Phases")).toBeInTheDocument();
		expect(screen.getByText("Vault")).toBeInTheDocument();
	});

	it("phase nav shows placeholder when no project in URL", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1");
		renderSidebar();

		expect(screen.getByText("Select a project to see phases")).toBeInTheDocument();
		expect(screen.queryByText("Vault")).not.toBeInTheDocument();
	});

	it("active phase has aria-current set", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1/vault");
		renderSidebar();

		const vaultLink = screen.getByRole("link", { name: /Vault/i });
		expect(vaultLink).toHaveAttribute("aria-current", "page");
	});

	it("renders all 5 phases with correct labels", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1/vault");
		renderSidebar();

		expect(screen.getByText("Vault")).toBeInTheDocument();
		expect(screen.getByText("Engine")).toBeInTheDocument();
		expect(screen.getByText("Map")).toBeInTheDocument();
		expect(screen.getByText("Stack")).toBeInTheDocument();
		expect(screen.getByText("Team")).toBeInTheDocument();
	});

	it("renders user name in bottom bar", () => {
		renderSidebar();
		expect(screen.getByText("Alice Smith")).toBeInTheDocument();
	});
});
