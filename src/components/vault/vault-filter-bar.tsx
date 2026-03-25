"use client";

import type { VaultListFilters } from "@/lib/queries/vault-list";
import { CalendarDays, ChevronDown, Filter, Flag, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { VaultSort } from "./vault-sort";

type SortValue = NonNullable<VaultListFilters["sortBy"]>;

interface VaultFilterBarProps {
	filters: VaultListFilters;
	onFiltersChange: (filters: VaultListFilters) => void;
	projectId: string;
	onClearAll: () => void;
	sortValue: SortValue;
	onSortChange: (sort: SortValue) => void;
}

const RESEARCH_METHODS = [
	{ value: "interview", label: "Interview" },
	{ value: "survey", label: "Survey" },
	{ value: "usability_test", label: "Usability Test" },
	{ value: "observation", label: "Observation" },
	{ value: "other", label: "Other" },
];

const EMOTIONAL_TONES = [
	{ value: "frustrated", label: "Frustrated", color: "var(--color-status-error)" },
	{ value: "delighted", label: "Delighted", color: "var(--color-status-success)" },
	{ value: "neutral", label: "Neutral", color: "var(--color-text-muted)" },
	{ value: "mixed", label: "Mixed", color: "var(--color-status-warning)" },
];

function activeFilterCount(filters: VaultListFilters): number {
	let n = 0;
	if (filters.researchMethod?.length) n++;
	if (filters.emotionalTone) n++;
	if (filters.dateFrom || filters.dateTo) n++;
	if (filters.followUpNeeded) n++;
	if (filters.tags?.length) n++;
	return n;
}

// ── Method multi-select ────────────────────────────────────────────────────────

function MethodFilter({
	value,
	onChange,
}: {
	value: string[];
	onChange: (v: string[]) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = value.length > 0;

	function toggle(method: string) {
		const next = value.includes(method) ? value.filter((m) => m !== method) : [...value, method];
		onChange(next);
	}

	return (
		<div
			ref={ref}
			className="relative"
			onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
		>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="listbox"
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none ${isActive ? "filter-pill-active" : "filter-pill"}`}
			>
				<span className="font-body">Method</span>
				{isActive && (
					<span className="flex h-4 w-4 items-center justify-center rounded-full bg-[--color-accent-gold] text-[0.6rem] font-bold text-[--color-text-inverse]">
						{value.length}
					</span>
				)}
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl py-1">
					{RESEARCH_METHODS.map((m) => (
						<button
							key={m.value}
							type="button"
							aria-pressed={value.includes(m.value)}
							onClick={() => toggle(m.value)}
							className="flex w-full items-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							<span
								className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded"
								style={{
									border: `1.5px solid ${value.includes(m.value) ? "var(--color-accent-gold)" : "var(--color-border-default)"}`,
									background: value.includes(m.value) ? "var(--color-accent-gold)" : "transparent",
								}}
							>
								{value.includes(m.value) && (
									<svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden={true}>
										<path
											d="M1 3l2 2 4-4"
											stroke="var(--color-text-inverse)"
											strokeWidth="1.5"
											strokeLinecap="round"
											strokeLinejoin="round"
										/>
									</svg>
								)}
							</span>
							<span className="font-body text-[0.8125rem] text-[--color-text-secondary]">
								{m.label}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Tone single-select ─────────────────────────────────────────────────────────

function ToneFilter({
	value,
	onChange,
}: {
	value: string | undefined;
	onChange: (v: string | undefined) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = Boolean(value);
	const selected = EMOTIONAL_TONES.find((t) => t.value === value);

	return (
		<div
			ref={ref}
			className="relative"
			onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
		>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="listbox"
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none ${isActive ? "filter-pill-active" : "filter-pill"}`}
			>
				{selected && (
					<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: selected.color }} />
				)}
				<span className="font-body">{selected?.label ?? "Tone"}</span>
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl py-1">
					{value && (
						<button
							type="button"
							onClick={() => {
								onChange(undefined);
								setOpen(false);
							}}
							className="flex w-full items-center gap-2 px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							Clear
						</button>
					)}
					{EMOTIONAL_TONES.map((t) => (
						<button
							key={t.value}
							type="button"
							aria-pressed={value === t.value}
							onClick={() => {
								onChange(t.value);
								setOpen(false);
							}}
							className="flex w-full items-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
							<span
								className={`font-body text-[0.8125rem] ${value === t.value ? "font-medium text-[--color-accent-gold]" : "font-normal text-[--color-text-secondary]"}`}
							>
								{t.label}
							</span>
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Date range ─────────────────────────────────────────────────────────────────

function DateFilter({
	dateFrom,
	dateTo,
	onChange,
}: {
	dateFrom: string | undefined;
	dateTo: string | undefined;
	onChange: (from: string | undefined, to: string | undefined) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = Boolean(dateFrom || dateTo);

	const label = (() => {
		if (dateFrom && dateTo) return `${dateFrom} – ${dateTo}`;
		if (dateFrom) return `From ${dateFrom}`;
		if (dateTo) return `To ${dateTo}`;
		return "Date";
	})();

	return (
		<div
			ref={ref}
			className="relative"
			onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
		>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="dialog"
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none ${isActive ? "filter-pill-active" : "filter-pill"}`}
			>
				<CalendarDays size={12} />
				<span className="font-body">{label}</span>
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-xl p-3">
					<div className="flex flex-col gap-2">
						<label htmlFor="vault-date-from" className="meta-label">
							From
						</label>
						<input
							id="vault-date-from"
							type="date"
							value={dateFrom ?? ""}
							onChange={(e) => onChange(e.target.value || undefined, dateTo)}
							className="meta-input rounded-lg px-2.5 py-1.5 font-body text-[0.8125rem] focus:outline-none"
						/>
						<label htmlFor="vault-date-to" className="meta-label">
							To
						</label>
						<input
							id="vault-date-to"
							type="date"
							value={dateTo ?? ""}
							onChange={(e) => onChange(dateFrom, e.target.value || undefined)}
							className="meta-input rounded-lg px-2.5 py-1.5 font-body text-[0.8125rem] focus:outline-none"
						/>
						{isActive && (
							<button
								type="button"
								onClick={() => {
									onChange(undefined, undefined);
									setOpen(false);
								}}
								className="mt-1 text-left font-body text-xs text-[--color-text-muted] underline transition-opacity hover:opacity-70 focus:outline-none"
							>
								Clear dates
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Tags filter ────────────────────────────────────────────────────────────────

function TagsFilter({
	value,
	onChange,
	projectId,
}: {
	value: string[];
	onChange: (v: string[]) => void;
	projectId: string;
}) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = value.length > 0;

	useEffect(() => {
		if (!open) return;
		const ctrl = new AbortController();
		const timer = setTimeout(() => {
			fetch(`/api/vault/tags?projectId=${projectId}&q=${encodeURIComponent(query)}`, {
				signal: ctrl.signal,
			})
				.then((r) => r.json())
				.then((tags: string[]) => setSuggestions(tags))
				.catch(() => {});
		}, 200);
		return () => {
			clearTimeout(timer);
			ctrl.abort();
		};
	}, [open, query, projectId]);

	function toggle(tag: string) {
		const next = value.includes(tag) ? value.filter((t) => t !== tag) : [...value, tag];
		onChange(next);
	}

	return (
		<div
			ref={ref}
			className="relative"
			onBlur={(e) => !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
		>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="listbox"
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none ${isActive ? "filter-pill-active" : "filter-pill"}`}
			>
				<span className="font-body">Tags</span>
				{isActive && (
					<span className="flex h-4 w-4 items-center justify-center rounded-full bg-[--color-accent-gold] text-[0.6rem] font-bold text-[--color-text-inverse]">
						{value.length}
					</span>
				)}
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-xl">
					<div className="border-b border-[--color-border-subtle] p-2">
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search tags..."
							className="meta-input w-full rounded-lg px-2.5 py-1.5 font-body text-[0.8125rem] focus:outline-none"
						/>
					</div>
					<div className="max-h-48 overflow-y-auto py-1">
						{suggestions.length === 0 && (
							<p className="px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted]">
								{query ? "No matching tags" : "No tags yet"}
							</p>
						)}
						{suggestions.map((tag) => (
							<button
								key={tag}
								type="button"
								aria-pressed={value.includes(tag)}
								onClick={() => toggle(tag)}
								className="flex w-full items-center gap-2 px-3 py-1.5 transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
							>
								<span
									className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded"
									style={{
										border: `1.5px solid ${value.includes(tag) ? "var(--color-accent-gold)" : "var(--color-border-default)"}`,
										background: value.includes(tag) ? "var(--color-accent-gold)" : "transparent",
									}}
								>
									{value.includes(tag) && (
										<svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden={true}>
											<path
												d="M1 3l2 2 4-4"
												stroke="var(--color-text-inverse)"
												strokeWidth="1.5"
												strokeLinecap="round"
												strokeLinejoin="round"
											/>
										</svg>
									)}
								</span>
								<span
									className={`font-mono text-xs ${value.includes(tag) ? "text-[--color-accent-gold]" : "text-[--color-text-secondary]"}`}
								>
									{tag}
								</span>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ── Follow-up toggle ───────────────────────────────────────────────────────────

function FollowUpFilter({
	value,
	onChange,
}: {
	value: boolean | undefined;
	onChange: (v: boolean | undefined) => void;
}) {
	const isActive = value === true;
	return (
		<button
			type="button"
			aria-pressed={isActive}
			onClick={() => onChange(isActive ? undefined : true)}
			className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none ${isActive ? "filter-pill-active" : "filter-pill"}`}
		>
			<Flag size={12} />
			<span className="font-body">Follow-up</span>
		</button>
	);
}

// ── Mobile sheet ───────────────────────────────────────────────────────────────

function MobileFiltersSheet({
	filters,
	onFiltersChange,
	projectId,
	sortValue,
	onSortChange,
	onClearAll,
	onClose,
}: {
	filters: VaultListFilters;
	onFiltersChange: (f: VaultListFilters) => void;
	projectId: string;
	sortValue: SortValue;
	onSortChange: (s: SortValue) => void;
	onClearAll: () => void;
	onClose: () => void;
}) {
	const filterCount = activeFilterCount(filters);

	// Escape key closes the sheet
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [onClose]);

	return (
		<dialog
			open
			className="fixed inset-0 z-50 m-0 flex max-w-none items-end border-0 bg-transparent p-0"
		>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is aria-hidden; Escape is handled above */}
			<div
				className="absolute inset-0 bg-[--color-overlay-scrim]"
				onClick={onClose}
				aria-hidden={true}
			/>

			{/* Sheet */}
			<div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[--color-bg-overlay] px-4 pb-8 pt-4">
				{/* Handle */}
				<div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[--color-border-default]" />

				<div className="mb-4 flex items-center justify-between">
					<span className="font-display text-base text-[--color-text-primary]">Filters</span>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close filters"
						className="text-[--color-text-muted] focus:outline-none"
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex flex-col gap-4">
					{/* Sort */}
					<div>
						<p className="meta-label">Sort</p>
						<VaultSort value={sortValue} onChange={onSortChange} />
					</div>

					{/* Method */}
					<div>
						<p className="meta-label">Research Method</p>
						<MethodFilter
							value={filters.researchMethod ?? []}
							onChange={(v) => onFiltersChange({ ...filters, researchMethod: v })}
						/>
					</div>

					{/* Tone */}
					<div>
						<p className="meta-label">Emotional Tone</p>
						<ToneFilter
							value={filters.emotionalTone}
							onChange={(v) => onFiltersChange({ ...filters, emotionalTone: v })}
						/>
					</div>

					{/* Date */}
					<div>
						<p className="meta-label">Date Range</p>
						<DateFilter
							dateFrom={filters.dateFrom}
							dateTo={filters.dateTo}
							onChange={(from, to) => onFiltersChange({ ...filters, dateFrom: from, dateTo: to })}
						/>
					</div>

					{/* Follow-up */}
					<div>
						<p className="meta-label">Flags</p>
						<FollowUpFilter
							value={filters.followUpNeeded}
							onChange={(v) => onFiltersChange({ ...filters, followUpNeeded: v })}
						/>
					</div>

					{/* Tags */}
					<div>
						<p className="meta-label">Tags</p>
						<TagsFilter
							value={filters.tags ?? []}
							onChange={(v) => onFiltersChange({ ...filters, tags: v })}
							projectId={projectId}
						/>
					</div>
				</div>

				<div className="mt-6 flex gap-3">
					{filterCount > 0 && (
						<button
							type="button"
							onClick={() => {
								onClearAll();
								onClose();
							}}
							className="flex-1 rounded-xl border border-[--color-border-default] py-2.5 font-body text-sm text-[--color-text-muted] transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							Clear all
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="flex-1 rounded-xl bg-[--color-accent-gold] py-2.5 font-body text-sm font-semibold text-[--color-text-inverse] transition-all duration-150 hover:brightness-110 focus:outline-none"
					>
						Apply
					</button>
				</div>
			</div>
		</dialog>
	);
}

// ── Main filter bar ────────────────────────────────────────────────────────────

export function VaultFilterBar({
	filters,
	onFiltersChange,
	projectId,
	onClearAll,
	sortValue,
	onSortChange,
}: VaultFilterBarProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const filterCount = activeFilterCount(filters);
	const hasActiveFilters = filterCount > 0;

	return (
		<>
			{/* Desktop filter row */}
			<div className="hidden items-center gap-2 md:flex">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<SlidersHorizontal size={14} className="shrink-0 text-[--color-text-muted]" />

					<MethodFilter
						value={filters.researchMethod ?? []}
						onChange={(v) => onFiltersChange({ ...filters, researchMethod: v })}
					/>
					<ToneFilter
						value={filters.emotionalTone}
						onChange={(v) => onFiltersChange({ ...filters, emotionalTone: v })}
					/>
					<DateFilter
						dateFrom={filters.dateFrom}
						dateTo={filters.dateTo}
						onChange={(from, to) => onFiltersChange({ ...filters, dateFrom: from, dateTo: to })}
					/>
					<FollowUpFilter
						value={filters.followUpNeeded}
						onChange={(v) => onFiltersChange({ ...filters, followUpNeeded: v })}
					/>
					<TagsFilter
						value={filters.tags ?? []}
						onChange={(v) => onFiltersChange({ ...filters, tags: v })}
						projectId={projectId}
					/>

					{hasActiveFilters && (
						<button
							type="button"
							onClick={onClearAll}
							className="font-body text-xs text-[--color-text-muted] underline transition-opacity duration-100 hover:opacity-70 focus:outline-none"
						>
							Clear all
						</button>
					)}
				</div>

				<VaultSort value={sortValue} onChange={onSortChange} />
			</div>

			{/* Mobile: "Filters" button */}
			<div className="flex items-center gap-2 md:hidden">
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					aria-expanded={mobileOpen}
					aria-haspopup="dialog"
					className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors duration-100 focus:outline-none ${hasActiveFilters ? "filter-pill-active" : "filter-pill"}`}
				>
					<Filter size={13} />
					<span className="font-body text-[0.8125rem]">Filters</span>
					{filterCount > 0 && (
						<span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[--color-accent-gold] px-1 text-[0.6rem] font-bold text-[--color-text-inverse]">
							{filterCount}
						</span>
					)}
				</button>
				<div className="ml-auto">
					<VaultSort value={sortValue} onChange={onSortChange} />
				</div>
			</div>

			{/* Mobile sheet */}
			{mobileOpen && (
				<MobileFiltersSheet
					filters={filters}
					onFiltersChange={onFiltersChange}
					projectId={projectId}
					sortValue={sortValue}
					onSortChange={onSortChange}
					onClearAll={onClearAll}
					onClose={() => setMobileOpen(false)}
				/>
			)}
		</>
	);
}
