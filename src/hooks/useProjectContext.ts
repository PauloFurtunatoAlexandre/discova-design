"use client";

import { createContext, useContext } from "react";

interface ProjectContextValue {
	project: {
		id: string;
		name: string;
		slug: string;
	};
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export const ProjectContextProvider = ProjectContext.Provider;

export function useProjectContext(): ProjectContextValue {
	const ctx = useContext(ProjectContext);
	if (!ctx) throw new Error("useProjectContext must be used within ProjectContextProvider");
	return ctx;
}
