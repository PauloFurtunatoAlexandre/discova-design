"use client";

import type { ResolvedPreset } from "@/lib/permissions/types";
import type { NoteListItem, VaultListFilters, VaultListResult } from "@/lib/queries/vault-list";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { VaultEmptyState } from "./vault-empty-state";
import { VaultFilterBar } from "./vault-filter-bar";
import { VaultList } from "./vault-list";
import { VaultSearch } from "./vault-search";

type SortValue = NonNullable<VaultListFilters["sortBy"]>;

interface VaultListPageProps {
	initialData: VaultListResult;
	workspaceId: string;
	projectId: string;
	canEdit: boolean;
	userPreset: ResolvedPreset;
}

function hasActiveFilters(search: string, filters: VaultListFilters): boolean {
	if (search) return true;
	if (filters.researchMethod?.length) return true;
	if (filters.emotionalTone) return true;
	if (filters.dateFrom || filters.dateTo) return true;
	if (filters.followUpNeeded) return true;
	if (filters.tags?.length) return true;
	return false;
}

export function VaultListPage({
	initialData,
	workspaceId,
	projectId,
	canEdit,
	userPreset,
}: VaultListPageProps) {
	const router = useRouter();

	// Interactive state
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [filters, setFilters] = useState<VaultListFilters>({});
	const [sort, setSort] = useState<SortValue>("newest");

	// Data state (seeded from SSR initialData)
	const [notes, setNotes] = useState<NoteListItem[]>(initialData.notes);
	const [totalCount, setTotalCount] = useState(initialData.totalCount);
	const [hasMore, setHasMore] = useState(initialData.hasMore);
	const [nextCursor, setNextCursor] = useState<string | null>(initialData.nextCursor);
	const [isLoading, setIsLoading] = useState(false);
	const [isSearching, setIsSearching] = useState(false);

	// The unfiltered project count — stays constant, used to detect empty project
	const projectNoteCount = initialData.totalCount;

	// Skip the first effect run (initial data already loaded from SSR)
	const initialized = useRef(false);

	// Debounce search input
	useEffect(() => {
		const t = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(t);
	}, [search]);

	// Build fetch URL
	function buildParams(cursor: string | null): URLSearchParams {
		const p = new URLSearchParams();
		p.set("workspaceId", workspaceId);
		p.set("projectId", projectId);
		if (debouncedSearch) p.set("search", debouncedSearch);
		for (const m of filters.researchMethod ?? []) p.append("method", m);
		if (filters.emotionalTone) p.set("tone", filters.emotionalTone);
		if (filters.dateFrom) p.set("dateFrom", filters.dateFrom);
		if (filters.dateTo) p.set("dateTo", filters.dateTo);
		if (filters.followUpNeeded) p.set("followUp", "true");
		for (const t of filters.tags ?? []) p.append("tag", t);
		p.set("sort", sort);
		if (cursor) p.set("cursor", cursor);
		return p;
	}

	// Fetch and replace (new search/filter/sort)
	async function fetchFresh() {
		setIsLoading(true);
		setIsSearching(true);
		try {
			const res = await fetch(`/api/vault/notes?${buildParams(null)}`);
			if (!res.ok) return;
			const data: VaultListResult = await res.json();
			setNotes(data.notes);
			setTotalCount(data.totalCount);
			setHasMore(data.hasMore);
			setNextCursor(data.nextCursor);
		} finally {
			setIsLoading(false);
			setIsSearching(false);
		}
	}

	// Fetch next page (append)
	async function handleLoadMore() {
		if (!nextCursor || isLoading) return;
		setIsLoading(true);
		try {
			const res = await fetch(`/api/vault/notes?${buildParams(nextCursor)}`);
			if (!res.ok) return;
			const data: VaultListResult = await res.json();
			setNotes((prev) => [...prev, ...data.notes]);
			setHasMore(data.hasMore);
			setNextCursor(data.nextCursor);
		} finally {
			setIsLoading(false);
		}
	}

	// Trigger fresh fetch when debounced search changes (after mount)
	// biome-ignore lint/correctness/useExhaustiveDependencies: fetchFresh reads current state via closure; re-adding it would cause infinite loops
	useEffect(() => {
		if (!initialized.current) return;
		fetchFresh();
	}, [debouncedSearch]);

	// Trigger fresh fetch when filters/sort change (after mount)
	// biome-ignore lint/correctness/useExhaustiveDependencies: fetchFresh reads current state via closure; re-adding it would cause infinite loops
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
		setSort("newest");
		// Reset to initial data
		setNotes(initialData.notes);
		setTotalCount(initialData.totalCount);
		setHasMore(initialData.hasMore);
		setNextCursor(initialData.nextCursor);
	}

	const isFiltered = hasActiveFilters(search, filters);
	const projectIsEmpty = projectNoteCount === 0;
	const showEmptyState = projectIsEmpty && !isFiltered;
	const showNoResults = !isLoading && !projectIsEmpty && isFiltered && notes.length === 0;

	return (
		<div className="relative flex min-h-full flex-col gap-6 p-8">
			{/* Page header */}
			<div className="flex items-center justify-between">
				<h1 className="font-display text-xl text-[--color-text-primary]">Research Vault</h1>

				{canEdit && !showEmptyState && (
					<button
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/vault/new`)}
						className="inline-flex items-center gap-2 rounded-lg bg-[--color-accent-gold] px-4 py-2.5 text-sm font-semibold text-[--color-text-inverse] transition-all duration-150 hover:brightness-110 active:scale-[0.98] focus:outline-none"
					>
						<Plus size={15} strokeWidth={2.5} />
						Add Note
					</button>
				)}
			</div>

			{/* Search + filters (hidden when project is empty) */}
			{!showEmptyState && (
				<>
					<VaultSearch value={search} onChange={setSearch} isSearching={isSearching} />
					<VaultFilterBar
						filters={filters}
						onFiltersChange={setFilters}
						projectId={projectId}
						onClearAll={clearAll}
						sortValue={sort}
						onSortChange={setSort}
					/>
				</>
			)}

			{/* Main content */}
			{showEmptyState ? (
				<VaultEmptyState
					preset={userPreset}
					workspaceId={workspaceId}
					projectId={projectId}
					canEdit={canEdit}
				/>
			) : showNoResults ? (
				<VaultEmptyState
					preset={userPreset}
					workspaceId={workspaceId}
					projectId={projectId}
					canEdit={canEdit}
					noResults
					onClearFilters={clearAll}
				/>
			) : (
				<VaultList
					notes={notes}
					workspaceId={workspaceId}
					projectId={projectId}
					hasMore={hasMore}
					isLoading={isLoading}
					onLoadMore={handleLoadMore}
					totalCount={totalCount}
				/>
			)}

			{/* FAB */}
			{canEdit && (
				<button
					type="button"
					onClick={() => router.push(`/${workspaceId}/${projectId}/vault/new`)}
					className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[--color-accent-gold] text-[--color-text-inverse] transition-all duration-200 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.97]"
					style={{ boxShadow: "var(--shadow-fab-gold)" }}
					aria-label="Add research note"
				>
					<Plus size={22} strokeWidth={2.5} />
				</button>
			)}
		</div>
	);
}
