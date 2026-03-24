"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { Bell, Menu, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Breadcrumb } from "./breadcrumb";
import { UserMenu } from "./user-menu";

interface TopbarProps {
	workspace: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
	projects: Array<{
		id: string;
		name: string;
		slug: string;
	}>;
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	userTier?: string | undefined;
}

export function Topbar({ workspace, projects, user, userTier }: TopbarProps) {
	const { toggle } = useSidebar();
	const [userMenuOpen, setUserMenuOpen] = useState(false);

	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "U";

	// Register ⌘K / Ctrl+K shortcut for search
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				console.log("Search opened");
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<header
			className="flex items-center justify-between px-6"
			style={{
				height: "var(--topbar-height, 56px)",
				backgroundColor: "var(--color-bg-surface)",
				borderBottom: "1px solid var(--color-border-subtle)",
				flexShrink: 0,
			}}
		>
			{/* Left side */}
			<div className="flex items-center gap-4 min-w-0">
				{/* Hamburger — mobile only */}
				<button
					type="button"
					onClick={toggle}
					className="rounded-md p-1.5 transition-colors md:hidden"
					style={{ color: "var(--color-text-muted)" }}
					aria-label="Open sidebar"
				>
					<Menu size={20} />
				</button>

				{/* Breadcrumb */}
				<Breadcrumb workspace={workspace} projects={projects} />
			</div>

			{/* Right side — Actions */}
			<div className="flex items-center gap-1">
				{/* Search button */}
				<button
					type="button"
					className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:opacity-80"
					style={{ color: "var(--color-text-muted)" }}
					aria-label="Search"
					onClick={() => console.log("Search opened")}
				>
					<Search size={16} />
					<span className="hidden sm:inline">Search</span>
					<kbd
						className="hidden items-center rounded px-1.5 py-0.5 text-xs sm:flex"
						style={{
							backgroundColor: "var(--color-bg-raised)",
							color: "var(--color-text-muted)",
							border: "1px solid var(--color-border-subtle)",
						}}
					>
						⌘K
					</kbd>
				</button>

				{/* Notifications bell */}
				<button
					type="button"
					className="rounded-md p-1.5 transition-colors hover:opacity-80"
					style={{ color: "var(--color-text-muted)" }}
					aria-label="Notifications"
				>
					<Bell size={18} />
				</button>

				{/* User avatar — opens user menu */}
				<div className="relative ml-1">
					<button
						type="button"
						onClick={() => setUserMenuOpen((prev) => !prev)}
						className="flex items-center justify-center overflow-hidden rounded-full transition-opacity hover:opacity-80"
						style={{
							width: 28,
							height: 28,
							backgroundColor: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-default)",
							color: "var(--color-text-primary)",
							fontSize: "11px",
							fontWeight: 600,
						}}
						aria-label="Open user menu"
						aria-expanded={userMenuOpen}
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
					</button>

					<UserMenu
						user={user}
						isOpen={userMenuOpen}
						onClose={() => setUserMenuOpen(false)}
						userTier={userTier}
						position="below"
					/>
				</div>
			</div>
		</header>
	);
}
