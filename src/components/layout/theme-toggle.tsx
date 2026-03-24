"use client";

import { useTheme } from "@/hooks/useTheme";
import { motion, useReducedMotion } from "framer-motion";
import { Monitor, Moon, Sun } from "lucide-react";

type ThemeOption = "dark" | "system" | "light";

const OPTIONS: Array<{ value: ThemeOption; icon: typeof Moon; label: string }> = [
	{ value: "dark", icon: Moon, label: "Dark" },
	{ value: "system", icon: Monitor, label: "System" },
	{ value: "light", icon: Sun, label: "Light" },
];

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const shouldReduceMotion = useReducedMotion();

	return (
		<div
			className="flex items-center rounded-full p-0.5"
			style={{ backgroundColor: "var(--color-bg-sunken)" }}
			role="radiogroup"
			aria-label="Theme selection"
		>
			{OPTIONS.map(({ value, icon: Icon, label }) => {
				const isActive = theme === value;
				return (
					<div key={value} className="relative">
						{isActive &&
							(shouldReduceMotion ? (
								<div
									className="absolute inset-0 rounded-full"
									style={{ backgroundColor: "var(--color-bg-raised)" }}
								/>
							) : (
								<motion.div
									layoutId="theme-indicator"
									className="absolute inset-0 rounded-full"
									style={{ backgroundColor: "var(--color-bg-raised)" }}
									transition={{ type: "spring", stiffness: 400, damping: 30 }}
								/>
							))}
						<button
							type="button"
							onClick={() => setTheme(value)}
							className="relative z-10 flex items-center justify-center rounded-full p-1.5 transition-colors"
							style={{
								color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
							}}
							aria-label={`${label} theme`}
							aria-pressed={isActive}
						>
							<Icon size={14} />
						</button>
					</div>
				);
			})}
		</div>
	);
}
