"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { HelpCircle, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface UserMenuProps {
	user: {
		id: string;
		name: string | null;
		email: string | null;
		image: string | null;
	};
	userTier?: string | undefined;
	/** Which side of the trigger the menu appears on */
	side?: "top" | "bottom";
	/** Required for the Settings link when the user is an admin */
	workspaceId?: string;
	/** The trigger element — rendered as the DropdownMenu trigger via asChild */
	children: ReactNode;
}

export function UserMenu({
	user,
	userTier,
	side = "bottom",
	workspaceId,
	children,
}: UserMenuProps) {
	const router = useRouter();
	const isAdmin = userTier === "admin";

	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.slice(0, 2)
				.join("")
				.toUpperCase()
		: "U";

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					side={side}
					align="end"
					sideOffset={8}
					className="z-50 w-60 outline-none"
					style={{
						backgroundColor: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						borderRadius: "var(--radius-lg)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					{/* User info — display only, not interactive */}
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
									alt={user.name ?? "User avatar"}
									className="h-full w-full object-cover"
								/>
							) : (
								<span aria-hidden="true">{initials}</span>
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

					{/* Theme toggle — stop key propagation so arrow keys work on ThemeToggle buttons
					     without also triggering DropdownMenu item navigation */}
					<div
						className="flex items-center justify-between px-4 py-2"
						style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
						onKeyDown={(e) => e.stopPropagation()}
					>
						<span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
							Theme
						</span>
						<ThemeToggle />
					</div>

					{/* Navigation items */}
					<DropdownMenu.Group className="py-1">
						{isAdmin && workspaceId && (
							<DropdownMenu.Item
								className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-[--color-bg-raised] data-[highlighted]:text-[--color-text-primary]"
								style={{ color: "var(--color-text-secondary)" }}
								onSelect={() => router.push(`/${workspaceId}/settings`)}
							>
								<Settings size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
								Settings
							</DropdownMenu.Item>
						)}
						<DropdownMenu.Item
							className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-[--color-bg-raised] data-[highlighted]:text-[--color-text-primary]"
							style={{ color: "var(--color-text-secondary)" }}
						>
							<HelpCircle size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
							Help & Support
						</DropdownMenu.Item>
					</DropdownMenu.Group>

					<DropdownMenu.Separator
						style={{ borderTop: "1px solid var(--color-border-subtle)", margin: 0 }}
					/>

					<DropdownMenu.Group className="py-1">
						<DropdownMenu.Item
							className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm outline-none transition-colors data-[highlighted]:bg-[--color-bg-raised] data-[highlighted]:text-[--color-text-primary]"
							style={{ color: "var(--color-text-secondary)" }}
							onSelect={() => signOut({ callbackUrl: "/login" })}
						>
							<LogOut size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
							Sign out
						</DropdownMenu.Item>
					</DropdownMenu.Group>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
}
