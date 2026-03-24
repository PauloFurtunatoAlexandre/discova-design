"use client";

import {
	type ReactNode,
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
	theme: Theme;
	resolvedTheme: ResolvedTheme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = "discova-theme";

function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "dark";
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getStoredTheme(): Theme {
	if (typeof window === "undefined") return "dark";
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "dark" || stored === "light" || stored === "system") return stored;
	return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<Theme>(getStoredTheme);
	const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(getSystemTheme);

	const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

	useEffect(() => {
		const root = document.documentElement;
		root.setAttribute("data-theme", resolvedTheme);

		root.classList.add("theme-transitioning");
		const timer = setTimeout(() => root.classList.remove("theme-transitioning"), 400);
		return () => clearTimeout(timer);
	}, [resolvedTheme]);

	useEffect(() => {
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			setSystemTheme(e.matches ? "dark" : "light");
		};
		mq.addEventListener("change", handler);
		return () => mq.removeEventListener("change", handler);
	}, []);

	const setTheme = useCallback((next: Theme) => {
		setThemeState(next);
		localStorage.setItem(STORAGE_KEY, next);
	}, []);

	const toggleTheme = useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	const value = useMemo<ThemeContextValue>(
		() => ({ theme, resolvedTheme, setTheme, toggleTheme }),
		[theme, resolvedTheme, setTheme, toggleTheme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
	const ctx = useContext(ThemeContext);
	if (!ctx) {
		throw new Error("useTheme must be used within a ThemeProvider");
	}
	return ctx;
}
