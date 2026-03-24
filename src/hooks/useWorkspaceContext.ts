"use client";

import { createContext, useContext } from "react";

interface WorkspaceContextValue {
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
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export const WorkspaceContextProvider = WorkspaceContext.Provider;

export function useWorkspaceContext(): WorkspaceContextValue {
	const ctx = useContext(WorkspaceContext);
	if (!ctx) throw new Error("useWorkspaceContext must be used within WorkspaceContextProvider");
	return ctx;
}
