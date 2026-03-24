"use client";

import { type ReactNode, createElement, createContext, useContext } from "react";

interface ProjectContextValue {
	projectId: string;
	projectName: string;
	projectSlug: string;
	workspaceId: string;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({
	children,
	value,
}: {
	children: ReactNode;
	value: ProjectContextValue;
}) {
	return createElement(ProjectContext.Provider, { value }, children);
}

export function useProjectContext(): ProjectContextValue {
	const ctx = useContext(ProjectContext);
	if (!ctx) {
		throw new Error("useProjectContext must be used within a ProjectProvider");
	}
	return ctx;
}
