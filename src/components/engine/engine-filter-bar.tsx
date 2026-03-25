"use client";

import type { EngineListFilters } from "@/lib/queries/engine-list";
import { ChevronDown, Filter, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ConfidenceRangeSlider } from "./confidence-range-slider";
import { EngineSort, type EngineSortValue } from "./engine-sort";

interface EngineFilterBarProps {
	filters: EngineListFilters;
	onFiltersChange: (filters: EngineListFilters) => void;
	onClearAll: () => void;
	sortValue: EngineSortValue;
	onSortChange: (sort: EngineSortValue) => void;
	themeTags: string[];
	authors: Array<{ id: string; name: string }>;
}

function activeFilterCount(filters: EngineListFilters): number {
	let n = 0;
	if (filters.themeTag) n++;
	if (filters.confidenceMin !== undefined || filters.confidenceMax !== undefined) n++;
	if (filters.connectionStatus && filters.connectionStatus !== "all") n++;
	if (filters.authorId) n++;
	return n;
}

// ── Theme tag single-select ────────────────────────────────────────────────────

function ThemeFilter({
	value,
	onChange,
	options,
}: {
	value: string | undefined;
	onChange: (v: string | undefined) => void;
	options: string[];
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = Boolean(value);

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
				<span className="font-body">{value ?? "Theme"}</span>
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
							className="flex w-full items-center px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							Clear
						</button>
					)}
					{options.length === 0 && (
						<p className="px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted]">
							No theme tags yet
						</p>
					)}
					{options.map((tag) => (
						<button
							key={tag}
							type="button"
							aria-pressed={value === tag}
							onClick={() => {
								onChange(tag);
								setOpen(false);
							}}
							className={`flex w-full items-center px-3 py-2 transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none ${value === tag ? "font-medium text-[--color-accent-blue]" : "font-normal text-[--color-text-secondary]"}`}
							style={{ fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
						>
							{tag}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Confidence range dropdown ──────────────────────────────────────────────────

function ConfidenceFilter({
	min,
	max,
	onChange,
}: {
	min: number | undefined;
	max: number | undefined;
	onChange: (min: number | undefined, max: number | undefined) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = min !== undefined || max !== undefined;

	const label = (() => {
		if (min !== undefined && max !== undefined) return `${min}%–${max}%`;
		if (min !== undefined) return `≥${min}%`;
		if (max !== undefined) return `≤${max}%`;
		return "Confidence";
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
				<span className="font-body">{label}</span>
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[260px] rounded-xl p-3">
					<ConfidenceRangeSlider
						min={min ?? 0}
						max={max ?? 90}
						onChange={(newMin, newMax) => {
							const effectiveMin = newMin === 0 ? undefined : newMin;
							const effectiveMax = newMax === 90 ? undefined : newMax;
							onChange(effectiveMin, effectiveMax);
						}}
					/>
					{isActive && (
						<button
							type="button"
							onClick={() => {
								onChange(undefined, undefined);
								setOpen(false);
							}}
							className="mt-2 text-left font-body text-xs text-[--color-text-muted] underline transition-opacity hover:opacity-70 focus:outline-none"
						>
							Clear range
						</button>
					)}
				</div>
			)}
		</div>
	);
}

// ── Connection status single-select ────────────────────────────────────────────

function ConnectionFilter({
	value,
	onChange,
}: {
	value: EngineListFilters["connectionStatus"];
	onChange: (v: EngineListFilters["connectionStatus"]) => void;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = value !== undefined && value !== "all";

	const OPTIONS = [
		{ value: "all" as const, label: "All" },
		{ value: "connected" as const, label: "Connected to Map" },
		{ value: "unconnected" as const, label: "Unconnected" },
	];

	const selected = OPTIONS.find((o) => o.value === value);

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
				<span className="font-body">{isActive ? (selected?.label ?? "Status") : "Status"}</span>
				<ChevronDown
					size={11}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute left-0 top-full z-20 mt-1 min-w-[170px] overflow-hidden rounded-xl py-1">
					{OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							aria-pressed={value === opt.value}
							onClick={() => {
								onChange(opt.value);
								setOpen(false);
							}}
							className={`flex w-full items-center px-3 py-2 text-left font-body text-[0.8125rem] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none ${value === opt.value ? "font-medium text-[--color-accent-blue]" : "font-normal text-[--color-text-secondary]"}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Author single-select ──────────────────────────────────────────────────────

function AuthorFilter({
	value,
	onChange,
	options,
}: {
	value: string | undefined;
	onChange: (v: string | undefined) => void;
	options: Array<{ id: string; name: string }>;
}) {
	const [open, setOpen] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const isActive = Boolean(value);
	const selected = options.find((o) => o.id === value);

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
				<span className="font-body">{selected?.name ?? "Author"}</span>
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
							className="flex w-full items-center px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none"
						>
							Clear
						</button>
					)}
					{options.length === 0 && (
						<p className="px-3 py-2 font-body text-[0.8125rem] text-[--color-text-muted]">
							No authors yet
						</p>
					)}
					{options.map((author) => (
						<button
							key={author.id}
							type="button"
							aria-pressed={value === author.id}
							onClick={() => {
								onChange(author.id);
								setOpen(false);
							}}
							className={`flex w-full items-center px-3 py-2 text-left font-body text-[0.8125rem] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none ${value === author.id ? "font-medium text-[--color-accent-blue]" : "font-normal text-[--color-text-secondary]"}`}
						>
							{author.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

// ── Mobile sheet ───────────────────────────────────────────────────────────────

function MobileFiltersSheet({
	filters,
	onFiltersChange,
	sortValue,
	onSortChange,
	onClearAll,
	onClose,
	themeTags,
	authors,
}: {
	filters: EngineListFilters;
	onFiltersChange: (f: EngineListFilters) => void;
	sortValue: EngineSortValue;
	onSortChange: (s: EngineSortValue) => void;
	onClearAll: () => void;
	onClose: () => void;
	themeTags: string[];
	authors: Array<{ id: string; name: string }>;
}) {
	const filterCount = activeFilterCount(filters);

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
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is aria-hidden; Escape is handled above */}
			<div
				className="absolute inset-0 bg-[--color-overlay-scrim]"
				onClick={onClose}
				aria-hidden={true}
			/>

			<div className="relative max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-[--color-bg-overlay] px-4 pb-8 pt-4">
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
					<div>
						<p className="meta-label">Sort</p>
						<EngineSort value={sortValue} onChange={onSortChange} />
					</div>

					<div>
						<p className="meta-label">Theme Tag</p>
						<ThemeFilter
							value={filters.themeTag}
							onChange={(v) => onFiltersChange({ ...filters, themeTag: v })}
							options={themeTags}
						/>
					</div>

					<div>
						<p className="meta-label">Confidence Range</p>
						<ConfidenceRangeSlider
							min={filters.confidenceMin ?? 0}
							max={filters.confidenceMax ?? 90}
							onChange={(min, max) =>
								onFiltersChange({
									...filters,
									confidenceMin: min === 0 ? undefined : min,
									confidenceMax: max === 90 ? undefined : max,
								})
							}
						/>
					</div>

					<div>
						<p className="meta-label">Connection Status</p>
						<ConnectionFilter
							value={filters.connectionStatus}
							onChange={(v) => onFiltersChange({ ...filters, connectionStatus: v })}
						/>
					</div>

					<div>
						<p className="meta-label">Author</p>
						<AuthorFilter
							value={filters.authorId}
							onChange={(v) => onFiltersChange({ ...filters, authorId: v })}
							options={authors}
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
						className="flex-1 rounded-xl bg-[--color-accent-blue] py-2.5 font-body text-sm font-semibold text-[--color-text-inverse] transition-all duration-150 hover:brightness-110 focus:outline-none"
					>
						Apply
					</button>
				</div>
			</div>
		</dialog>
	);
}

// ── Main filter bar ────────────────────────────────────────────────────────────

export function EngineFilterBar({
	filters,
	onFiltersChange,
	onClearAll,
	sortValue,
	onSortChange,
	themeTags,
	authors,
}: EngineFilterBarProps) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const filterCount = activeFilterCount(filters);
	const hasActiveFilters = filterCount > 0;

	return (
		<>
			{/* Desktop filter row */}
			<div className="hidden items-center gap-2 md:flex">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<SlidersHorizontal size={14} className="shrink-0 text-[--color-text-muted]" />

					<ThemeFilter
						value={filters.themeTag}
						onChange={(v) => onFiltersChange({ ...filters, themeTag: v })}
						options={themeTags}
					/>
					<ConfidenceFilter
						min={filters.confidenceMin}
						max={filters.confidenceMax}
						onChange={(min, max) =>
							onFiltersChange({ ...filters, confidenceMin: min, confidenceMax: max })
						}
					/>
					<ConnectionFilter
						value={filters.connectionStatus}
						onChange={(v) => onFiltersChange({ ...filters, connectionStatus: v })}
					/>
					<AuthorFilter
						value={filters.authorId}
						onChange={(v) => onFiltersChange({ ...filters, authorId: v })}
						options={authors}
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

				<EngineSort value={sortValue} onChange={onSortChange} />
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
						<span className="flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-[--color-accent-blue] px-1 text-[0.6rem] font-bold text-[--color-text-inverse]">
							{filterCount}
						</span>
					)}
				</button>
				<div className="ml-auto">
					<EngineSort value={sortValue} onChange={onSortChange} />
				</div>
			</div>

			{/* Mobile sheet */}
			{mobileOpen && (
				<MobileFiltersSheet
					filters={filters}
					onFiltersChange={onFiltersChange}
					sortValue={sortValue}
					onSortChange={onSortChange}
					onClearAll={onClearAll}
					onClose={() => setMobileOpen(false)}
					themeTags={themeTags}
					authors={authors}
				/>
			)}
		</>
	);
}
