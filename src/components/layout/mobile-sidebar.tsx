"use client";

import { useSidebar } from "@/hooks/useSidebar";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import type { WorkspaceItem } from "./workspace-switcher";

interface MobileSidebarProps {
	workspace: {
		id: string;
		name: string;
		slug: string;
		logoUrl: string | null;
	};
	allWorkspaces?: WorkspaceItem[];
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

export function MobileSidebar({
	workspace,
	allWorkspaces = [],
	projects,
	user,
	userTier,
}: MobileSidebarProps) {
	const { isOpen, close } = useSidebar();
	const pathname = usePathname();

	// Close when navigating to a new page
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname is used as a trigger to detect route changes
	useEffect(() => {
		close();
	}, [pathname, close]);

	// Close on Escape key
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") close();
		}
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			return () => document.removeEventListener("keydown", handleKeyDown);
		}
	}, [isOpen, close]);

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Backdrop */}
					<motion.div
						key="backdrop"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="fixed inset-0 z-40 md:hidden"
						style={{ backgroundColor: "var(--color-overlay-scrim)" }}
						onClick={close}
						aria-hidden="true"
					/>

					{/* Drawer */}
					<motion.div
						key="drawer"
						initial={{ x: "-100%" }}
						animate={{ x: 0 }}
						exit={{ x: "-100%" }}
						transition={{ type: "spring", stiffness: 400, damping: 35 }}
						className="fixed left-0 top-0 z-50 h-full md:hidden"
					>
						<Sidebar
							workspace={workspace}
							allWorkspaces={allWorkspaces}
							projects={projects}
							user={user}
							userTier={userTier}
						/>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
