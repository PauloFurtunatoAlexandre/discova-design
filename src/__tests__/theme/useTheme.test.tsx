import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

function ThemeDisplay() {
	const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
	return (
		<div>
			<span data-testid="theme">{theme}</span>
			<span data-testid="resolved">{resolvedTheme}</span>
			<button data-testid="toggle" onClick={toggleTheme} type="button">
				Toggle
			</button>
			<button data-testid="set-light" onClick={() => setTheme("light")} type="button">
				Light
			</button>
			<button data-testid="set-dark" onClick={() => setTheme("dark")} type="button">
				Dark
			</button>
			<button data-testid="set-system" onClick={() => setTheme("system")} type="button">
				System
			</button>
		</div>
	);
}

describe("useTheme", () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.removeAttribute("data-theme");
	});

	it("defaults to dark theme", () => {
		render(
			<ThemeProvider>
				<ThemeDisplay />
			</ThemeProvider>,
		);
		expect(screen.getByTestId("theme").textContent).toBe("dark");
		expect(screen.getByTestId("resolved").textContent).toBe("dark");
	});

	it("persists theme to localStorage", async () => {
		const user = userEvent.setup();
		render(
			<ThemeProvider>
				<ThemeDisplay />
			</ThemeProvider>,
		);

		await user.click(screen.getByTestId("set-light"));
		expect(localStorage.getItem("discova-theme")).toBe("light");
		expect(screen.getByTestId("theme").textContent).toBe("light");
	});

	it("toggles between dark and light", async () => {
		const user = userEvent.setup();
		render(
			<ThemeProvider>
				<ThemeDisplay />
			</ThemeProvider>,
		);

		expect(screen.getByTestId("resolved").textContent).toBe("dark");

		await user.click(screen.getByTestId("toggle"));
		expect(screen.getByTestId("resolved").textContent).toBe("light");

		await user.click(screen.getByTestId("toggle"));
		expect(screen.getByTestId("resolved").textContent).toBe("dark");
	});

	it("sets data-theme attribute on html element", async () => {
		const user = userEvent.setup();
		render(
			<ThemeProvider>
				<ThemeDisplay />
			</ThemeProvider>,
		);

		await user.click(screen.getByTestId("set-light"));
		expect(document.documentElement.getAttribute("data-theme")).toBe("light");
	});

	it("reads stored theme on mount", () => {
		localStorage.setItem("discova-theme", "light");

		render(
			<ThemeProvider>
				<ThemeDisplay />
			</ThemeProvider>,
		);

		expect(screen.getByTestId("theme").textContent).toBe("light");
	});

	it("throws when used outside ThemeProvider", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => render(<ThemeDisplay />)).toThrow("useTheme must be used within a ThemeProvider");

		spy.mockRestore();
	});
});
