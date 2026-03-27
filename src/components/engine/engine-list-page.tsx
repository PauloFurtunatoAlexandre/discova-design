"use client";

import { EngineFilterBar } from "@/components/engine/engine-filter-bar";
import dynamic from "next/dynamic";

const CreateInsightForm = dynamic(() => import("@/components/engine/create-insight-form").then((m) => m.CreateInsightForm), { ssr: false });
import type { EngineSortValue } from "@/components/engine/engine-sort";
import { InsightCard } from "@/components/engine/insight-card";
import { InsightCardExpanded } from "@/components/engine/insight-card-expanded";
import type { EngineListFilters, EngineListResult } from "@/lib/queries/engine-list";
import { AnimatePresence } from "framer-motion";
import { Lightbulb, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface EngineListPageProps {
	initialData: EngineListResult;
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
	themeTags: string[];
	authors: Array<{ id: string; name: string }>;
}

function hasActiveFilters(search: string, filters: EngineListFilters): boolean {
	if (search) return true;
	if (filters.themeTag) return true;
	if (filters.confidenceMin !== undefined) return true;
	if (filters.confidenceMax !== undefined) return true;
	if (filters.connectionStatus && filters.connectionStatus !== "all") return true;
	if (filters.authorId) return true;
	return false;
}

export function EngineListPage({
	initialData,
	workspaceId,
	projectId,
	canEdit,
	themeTags,
	authors,
}: EngineListPageProps) {
	const router = useRouter();

	// Interactive state
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [filters, setFilters] = useState<EngineListFilters>({});
	const [sort, setSort] = useState<EngineSortValue>("confidence_desc");

	// Data state
	const [insights, setInsights] = useState(initialData.insights);
	const [totalCount, setTotalCount] = useState(initialData.totalCount);
	const [connectedCount, setConnectedCount] = useState(initialData.connectedCount);
	const [hasMore, setHasMore] = useState(initialData.hasMore);
	const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor);
	const [isLoading, setIsLoading] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	// UI state
	const [showCreate, setShowCreate] = useState(false);
	const [expandedInsightId, setExpandedInsightId] = useState<string | null>(null);

	const projectInsightCount = initialData.totalCount;
	const initialized = useRef(false);

	// Debounce search
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(t);
	}, [search]);

	// Build fetch URL
	const buildParams = useCallback(
		(cursor: string | null): URLSearchParams => {
			const p = new URLSearchParams();
			p.set("workspaceId", workspaceId);
			p.set("projectId", projectId);
			if (debouncedSearch) p.set("search", debouncedSearch);
			if (filters.themeTag) p.set("themeTag", filters.themeTag);
			if (filters.confidenceMin !== undefined) p.set("confMin", String(filters.confidenceMin));
			if (filters.confidenceMax !== undefined) p.set("confMax", String(filters.confidenceMax));
			if (filters.connectionStatus && filters.connectionStatus !== "all")
				p.set("connection", filters.connectionStatus);
			if (filters.authorId) p.set("author", filters.authorId);
			p.set("sort", sort);
			if (cursor) p.set("cursor", cursor);
			return p;
		},
		[workspaceId, projectId, debouncedSearch, filters, sort],
	);

	// Fetch fresh data
	const fetchFresh = useCallback(async () => {
		setIsLoading(true);
		setIsSearching(true);
		try {
			const res = await fetch(`/api/engine/insights?${buildParams(null)}`);
			if (!res.ok) return;
			const data: EngineListResult = await res.json();
			setInsights(data.insights);
			setTotalCount(data.totalCount);
			setConnectedCount(data.connectedCount);
			setHasMore(data.hasMore);
			setNextCursor(data.nextCursor);
		} finally {
			setIsLoading(false);
			setIsSearching(false);
		}
	}, [buildParams]);

	// Load more (append)
	async function handleLoadMore() {
		if (!nextCursor || isLoading) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/engine/insights?${buildParams(nextCursor)}`);
			if (!res.ok) return;
			const data: EngineListResult = await res.json();
			setInsights((prev) => [...prev, ...data.insights]);
			setHasMore(data.hasMore);
			setNextCursor(data.nextCursor);
		} finally {
			setIsLoading(false);
		}
	}

	// Trigger fetch on debounced search change
	// biome-ignore lint/correctness/useExhaustiveDependencies: fetchFresh reads current state via closure
	useEffect(() => {
		if (!initialized.current) return;
		fetchFresh();
	}, [debouncedSearch]);

	// Trigger fetch on filter/sort change
	// biome-ignore lint/correctness/useExhaustiveDependencies: fetchFresh reads current state via closure
	useEffect(() => {
		if (!initialized.current) {
			initialized.current = true;
			return;
		}
		fetchFresh();
	}, [filters, sort]);

	function clearAll() {
		setSearch("");
		setDebouncedSearch("");
		setFilters({});
		setSort("confidence_desc");
		setInsights(initialData.insights);
		setTotalCount(initialData.totalCount);
		setConnectedCount(initialData.connectedCount);
		setHasMore(initialData.hasMore);
		setNextCursor(initialData.nextCursor);
	}

	function handleCreated(_insightId: string) {
		setShowCreate(false);
		router.refresh();
	}

	const isFiltered = hasActiveFilters(search, filters);
	const projectIsEmpty = projectInsightCount === 0 && !isFiltered;
	const showNoResults = !isLoading && !projectIsEmpty && isFiltered && insights.length === 0;

	// Check if project has any notes (for empty state CTA)
	const hasNotes = true; // Server-side check could populate this; for now assume yes

	return (
		<div className="relative flex min-h-full flex-col gap-6 p-8">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<div>
					<h1
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: "1.5rem",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						Insight Engine
					</h1>
					{!projectIsEmpty && (
						<p
							className="mt-1"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.875rem",
								color: "var(--color-text-muted)",
							}}
						>
							{totalCount} insight{totalCount !== 1 ? "s" : ""} · {connectedCount} connected
						</p>
					)}
				</div>

				{canEdit && !projectIsEmpty && (
					<button
						type="button"
						onClick={() => setShowCreate(true)}
						className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-blue]"
						style={{
							fontFamily: "var(--font-body)",
							background: "var(--color-accent-blue)",
							color: "var(--color-text-inverse)",
						}}
					>
						<Plus size={14} />
						Create Insight
					</button>
				)}
			</div>

			{/* Search + Filters (hidden when empty project) */}
			{!projectIsEmpty && (
				<>
					{/* Search */}
					<div className="relative max-w-md">
						<Search
							size={15}
							className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[--color-text-muted]"
						/>
						<input
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search insights..."
							className="meta-input w-full rounded-lg py-2 pl-9 pr-3 font-body text-sm focus:outline-none focus:ring-1 focus:ring-[--color-accent-blue]"
							style={{
								background: "var(--color-bg-sunken)",
								border: "1px solid var(--color-border-subtle)",
								color: "var(--color-text-primary)",
							}}
						/>
						{isSearching && (
							<div
								className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin rounded-full border-2 border-transparent"
								style={{ borderTopColor: "var(--color-accent-blue)" }}
							/>
						)}
					</div>

					{/* Filters */}
					<EngineFilterBar
						filters={filters}
						onFiltersChange={setFilters}
						onClearAll={clearAll}
						sortValue={sort}
						onSortChange={setSort}
						themeTags={themeTags}
						authors={authors}
					/>
				</>
			)}

			{/* Main content */}
			{projectIsEmpty ? (
				<EngineEmptyState
					canEdit={canEdit}
					hasNotes={hasNotes}
					workspaceId={workspaceId}
					projectId={projectId}
					onCreateClick={() => setShowCreate(true)}
				/>
			) : showNoResults ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<p
						className="mb-3"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.9375rem",
							color: "var(--color-text-muted)",
						}}
					>
						No insights match your filters.
					</p>
					<button
						type="button"
						onClick={clearAll}
						className="text-sm underline focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							color: "var(--color-accent-blue)",
							background: "none",
							border: "none",
							cursor: "pointer",
						}}
					>
						Clear all filters
					</button>
				</div>
			) : (
				<div className="max-w-2xl">
					{insights.map((insight) => (
						<InsightCard
							key={insight.id}
							insight={{ ...insight, evidence: [], acceptedBy: insight.acceptedBy }}
							variant="compact"
							canEdit={canEdit}
							workspaceId={workspaceId}
							projectId={projectId}
							onClick={() => setExpandedInsightId(insight.id)}
						/>
					))}

					{/* Load more */}
					{hasMore && (
						<div className="mt-4 flex justify-center">
							<button
								type="button"
								onClick={handleLoadMore}
								disabled={isLoading}
								className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all duration-150 hover:brightness-110 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-accent-blue]"
								style={{
									fontFamily: "var(--font-body)",
									border: "1px solid var(--color-border-default)",
									color: "var(--color-text-secondary)",
									background: "var(--color-bg-surface)",
								}}
							>
								{isLoading ? "Loading..." : "Load more"}
							</button>
						</div>
					)}
				</div>
			)}

			{/* Expanded insight panel */}
			<AnimatePresence>
				{expandedInsightId && (
					<InsightCardExpanded
						key={expandedInsightId}
						insightId={expandedInsightId}
						workspaceId={workspaceId}
						projectId={projectId}
						canEdit={canEdit}
						onClose={() => setExpandedInsightId(null)}
						onDelete={() => {
							setExpandedInsightId(null);
							fetchFresh();
						}}
					/>
				)}
			</AnimatePresence>

			{/* Create insight slide-over */}
			<AnimatePresence>
				{showCreate && (
					<CreateInsightForm
						key="create-form"
						workspaceId={workspaceId}
						projectId={projectId}
						onCreated={handleCreated}
						onClose={() => setShowCreate(false)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Empty State ─────────────────────────────────────────────────────────────────

function EngineEmptyState({
	canEdit,
	hasNotes,
	workspaceId,
	projectId,
	onCreateClick,
}: {
	canEdit: boolean;
	hasNotes: boolean;
	workspaceId: string;
	projectId: string;
	onCreateClick: () => void;
}) {
	const router = useRouter();

	return (
		<div
			className="flex flex-col items-center justify-center py-20 text-center"
			style={{ maxWidth: 400, margin: "0 auto" }}
		>
			<div
				className="mb-5 flex h-12 w-12 items-center justify-center rounded-full"
				style={{
					background: "color-mix(in srgb, var(--color-accent-blue) 12%, transparent)",
				}}
			>
				<Lightbulb size={22} style={{ color: "var(--color-accent-blue)" }} />
			</div>

			<h2
				style={{
					fontFamily: "var(--font-serif)",
					fontSize: "1.25rem",
					fontWeight: 500,
					color: "var(--color-text-primary)",
					marginBottom: "0.5rem",
				}}
			>
				No insights yet
			</h2>

			{hasNotes ? (
				<>
					<p
						className="mb-6"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.875rem",
							color: "var(--color-text-secondary)",
							lineHeight: 1.6,
						}}
					>
						Analyse a research note to generate AI-powered insights, or create one manually.
					</p>

					{canEdit && (
						<div className="flex flex-col gap-3 w-full">
							<button
								type="button"
								onClick={() => router.push(`/${workspaceId}/${projectId}/vault`)}
								className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none"
								style={{
									fontFamily: "var(--font-body)",
									background: "var(--color-accent-blue)",
									color: "var(--color-text-inverse)",
								}}
							>
								Analyse a note →
							</button>
							<button
								type="button"
								onClick={onCreateClick}
								className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none"
								style={{
									fontFamily: "var(--font-body)",
									border: "1px solid var(--color-border-default)",
									color: "var(--color-text-secondary)",
									background: "transparent",
								}}
							>
								Create insight manually
							</button>
						</div>
					)}
				</>
			) : (
				<>
					<p
						className="mb-6"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.875rem",
							color: "var(--color-text-secondary)",
							lineHeight: 1.6,
						}}
					>
						Add research notes first, then come back to generate insights.
					</p>

					<button
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/vault`)}
						className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus-visible:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							background: "var(--color-accent-gold)",
							color: "var(--color-text-inverse)",
						}}
					>
						Go to Vault →
					</button>
				</>
			)}
		</div>
	);
}
