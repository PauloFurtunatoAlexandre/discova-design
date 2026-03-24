"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { HelpCircle, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useRef } from "react";

interface UserMenuProps {
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	isOpen: boolean;
	onClose: () => void;
	userTier?: string | undefined;
	position?: "above" | "below";
}

export function UserMenu({ user, isOpen, onClose, userTier, position = "above" }: UserMenuProps) {
	const ref = useRef<HTMLDivElement>(null);
	const shouldReduceMotion = useReducedMotion();
	const isAdmin = userTier === "admin";

	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "U";

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onClose();
			}
		}
		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [isOpen, onClose]);

	// Close on Escape
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, onClose]);

	const menuVariants = {
		hidden: { opacity: 0, scale: 0.95 },
		visible: {
			opacity: 1,
			scale: 1,
			transition: {
				type: "spring" as const,
				stiffness: 400,
				damping: 30,
			},
		},
		exit: {
			opacity: 0,
			scale: 0.95,
			transition: { duration: 0.12 },
		},
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					ref={ref}
					{...(!shouldReduceMotion
						? {
								variants: menuVariants,
								initial: "hidden" as const,
								animate: "visible" as const,
								exit: "exit" as const,
							}
						: {
								initial: { opacity: 0 },
								animate: { opacity: 1 },
								exit: { opacity: 0 },
							})}
					className="absolute z-50 w-60"
					style={{
						[position === "above" ? "bottom" : "top"]: "calc(100% + 8px)",
						left: 0,
						backgroundColor: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-lg)",
						boxShadow: "var(--shadow-modal)",
					}}
					role="menu"
					aria-label="User menu"
				>
					{/* User info header */}
					<div
						className="flex items-center gap-3 px-4 py-3"
						style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
					>
						<div
							className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
							style={{
								backgroundColor: "var(--color-bg-raised)",
								color: "var(--color-text-primary)",
								border: "1px solid var(--color-border-default)",
							}}
						>
							{user.image ? (
								<img
									src={user.image}
									alt={user.name ?? "User"}
									className="h-full w-full object-cover"
								/>
							) : (
								initials
							)}
						</div>
						<div className="min-w-0">
							{user.name && (
								<p
									className="truncate text-sm font-semibold"
									style={{ color: "var(--color-text-primary)" }}
								>
									{user.name}
								</p>
							)}
							{user.email && (
								<p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
									{user.email}
								</p>
							)}
						</div>
					</div>

					{/* Theme toggle */}
					<div
						className="flex items-center justify-between px-4 py-2"
						style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
					>
						<span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
							Theme
						</span>
						<ThemeToggle />
					</div>

					{/* Menu items */}
					<div className="py-1">
						{isAdmin && (
							<button
								type="button"
								className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-80"
								style={{ color: "var(--color-text-secondary)" }}
								role="menuitem"
							>
								<Settings size={14} style={{ flexShrink: 0 }} />
								Settings
							</button>
						)}
						<button
							type="button"
							className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-80"
							style={{ color: "var(--color-text-secondary)" }}
							role="menuitem"
						>
							<HelpCircle size={14} style={{ flexShrink: 0 }} />
							Help & Support
						</button>
					</div>

					{/* Sign out */}
					<div className="py-1" style={{ borderTop: "1px solid var(--color-border-subtle)" }}>
						<button
							type="button"
							onClick={() => signOut({ callbackUrl: "/login" })}
							className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:opacity-80"
							style={{ color: "var(--color-text-secondary)" }}
							role="menuitem"
						>
							<LogOut size={14} style={{ flexShrink: 0 }} />
							Sign out
						</button>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
