import { Topbar } from "@/components/layout/topbar";
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
		...props
	}: {
		children: React.ReactNode;
		href: string;
		className?: string;
		style?: React.CSSProperties;
		[key: string]: unknown;
	}) => (
		<a href={href} className={className} style={style} {...props}>
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

function renderTopbar() {
	return render(
		<SidebarProvider>
			<Topbar workspace={mockWorkspace} projects={mockProjects} user={mockUser} />
		</SidebarProvider>,
	);
}

describe("Topbar", () => {
	beforeEach(() => {
		vi.mocked(usePathname).mockReturnValue("/");
	});

	it("renders breadcrumb with workspace name", () => {
		renderTopbar();
		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
	});

	it("breadcrumb shows project name when project is active", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1");
		renderTopbar();

		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Project Alpha")).toBeInTheDocument();
	});

	it("breadcrumb shows phase name when phase is active", () => {
		vi.mocked(usePathname).mockReturnValue("/ws-1/proj-1/vault");
		renderTopbar();

		expect(screen.getByText("Acme Corp")).toBeInTheDocument();
		expect(screen.getByText("Project Alpha")).toBeInTheDocument();
		expect(screen.getByText("Research Vault")).toBeInTheDocument();
	});

	it("renders search button with ⌘K badge", () => {
		renderTopbar();
		expect(screen.getByRole("button", { name: /search/i })).toBeInTheDocument();
		expect(screen.getByText("⌘K")).toBeInTheDocument();
	});

	it("renders hamburger button in DOM for mobile", () => {
		renderTopbar();
		expect(screen.getByRole("button", { name: /open sidebar/i })).toBeInTheDocument();
	});

	it("hamburger button has mobile-only class", () => {
		renderTopbar();
		const hamburger = screen.getByRole("button", { name: /open sidebar/i });
		expect(hamburger.className).toContain("md:hidden");
	});
});
