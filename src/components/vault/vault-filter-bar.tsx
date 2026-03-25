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

// Shared pill style for active filter controls
const activePillStyle = {
	background: "var(--color-accent-gold-muted)",
	border: "1px solid var(--color-accent-gold-border)",
	color: "var(--color-accent-gold)",
};

const defaultPillStyle = {
	background: "var(--color-bg-raised)",
	border: "1px solid var(--color-border-subtle)",
	color: "var(--color-text-secondary)",
};

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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none"
				style={isActive ? activePillStyle : defaultPillStyle}
			>
				<span style={{ fontFamily: "var(--font-body)" }}>Method</span>
				{isActive && (
					<span
						className="flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold"
						style={{ background: "var(--color-accent-gold)", color: "var(--color-text-inverse)" }}
					>
						{value.length}
					</span>
				)}
				<ChevronDown
					size={11}
					style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}
				/>
			</button>

			{open && (
				<div
					className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl py-1"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					{RESEARCH_METHODS.map((m) => (
						<button
							key={m.value}
							type="button"
							onClick={() => toggle(m.value)}
							className="flex w-full items-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-white/5 focus:outline-none"
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
							<span
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.8125rem",
									color: "var(--color-text-secondary)",
								}}
							>
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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none"
				style={isActive ? activePillStyle : defaultPillStyle}
			>
				{selected && (
					<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: selected.color }} />
				)}
				<span style={{ fontFamily: "var(--font-body)" }}>{selected?.label ?? "Tone"}</span>
				<ChevronDown
					size={11}
					style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}
				/>
			</button>

			{open && (
				<div
					className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl py-1"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					{value && (
						<button
							type="button"
							onClick={() => {
								onChange(undefined);
								setOpen(false);
							}}
							className="flex w-full items-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-white/5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-text-muted)",
							}}
						>
							Clear
						</button>
					)}
					{EMOTIONAL_TONES.map((t) => (
						<button
							key={t.value}
							type="button"
							onClick={() => {
								onChange(t.value);
								setOpen(false);
							}}
							className="flex w-full items-center gap-2 px-3 py-2 transition-colors duration-75 hover:bg-white/5 focus:outline-none"
						>
							<span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.color }} />
							<span
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.8125rem",
									color:
										value === t.value ? "var(--color-accent-gold)" : "var(--color-text-secondary)",
									fontWeight: value === t.value ? 500 : 400,
								}}
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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none"
				style={isActive ? activePillStyle : defaultPillStyle}
			>
				<CalendarDays size={12} />
				<span style={{ fontFamily: "var(--font-body)" }}>{label}</span>
				<ChevronDown
					size={11}
					style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}
				/>
			</button>

			{open && (
				<div
					className="absolute left-0 top-full z-20 mt-1 min-w-[220px] rounded-xl p-3"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					<div className="flex flex-col gap-2">
						<label
							htmlFor="vault-date-from"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							From
						</label>
						<input
							id="vault-date-from"
							type="date"
							value={dateFrom ?? ""}
							onChange={(e) => onChange(e.target.value || undefined, dateTo)}
							className="rounded-lg px-2.5 py-1.5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								background: "var(--color-bg-sunken)",
								border: "1px solid var(--color-border-default)",
								color: "var(--color-text-primary)",
							}}
						/>
						<label
							htmlFor="vault-date-to"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							To
						</label>
						<input
							id="vault-date-to"
							type="date"
							value={dateTo ?? ""}
							onChange={(e) => onChange(dateFrom, e.target.value || undefined)}
							className="rounded-lg px-2.5 py-1.5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								background: "var(--color-bg-sunken)",
								border: "1px solid var(--color-border-default)",
								color: "var(--color-text-primary)",
							}}
						/>
						{isActive && (
							<button
								type="button"
								onClick={() => {
									onChange(undefined, undefined);
									setOpen(false);
								}}
								className="mt-1 text-left transition-opacity hover:opacity-70 focus:outline-none"
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.75rem",
									color: "var(--color-text-muted)",
									textDecoration: "underline",
								}}
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
		fetch(`/api/vault/tags?projectId=${projectId}&q=${encodeURIComponent(query)}`, {
			signal: ctrl.signal,
		})
			.then((r) => r.json())
			.then((tags: string[]) => setSuggestions(tags))
			.catch(() => {});
		return () => ctrl.abort();
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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none"
				style={isActive ? activePillStyle : defaultPillStyle}
			>
				<span style={{ fontFamily: "var(--font-body)" }}>Tags</span>
				{isActive && (
					<span
						className="flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold"
						style={{ background: "var(--color-accent-gold)", color: "var(--color-text-inverse)" }}
					>
						{value.length}
					</span>
				)}
				<ChevronDown
					size={11}
					style={{ transform: open ? "rotate(180deg)" : undefined, transition: "transform 150ms" }}
				/>
			</button>

			{open && (
				<div
					className="absolute left-0 top-full z-20 mt-1 min-w-[200px] overflow-hidden rounded-xl"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					<div className="p-2" style={{ borderBottom: "1px solid var(--color-border-subtle)" }}>
						<input
							type="text"
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							placeholder="Search tags..."
							className="w-full rounded-lg px-2.5 py-1.5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								background: "var(--color-bg-sunken)",
								border: "1px solid var(--color-border-default)",
								color: "var(--color-text-primary)",
							}}
						/>
					</div>
					<div className="max-h-48 overflow-y-auto py-1">
						{suggestions.length === 0 && (
							<p
								className="px-3 py-2"
								style={{
									fontFamily: "var(--font-body)",
									fontSize: "0.8125rem",
									color: "var(--color-text-muted)",
								}}
							>
								{query ? "No matching tags" : "No tags yet"}
							</p>
						)}
						{suggestions.map((tag) => (
							<button
								key={tag}
								type="button"
								onClick={() => toggle(tag)}
								className="flex w-full items-center gap-2 px-3 py-1.5 transition-colors duration-75 hover:bg-white/5 focus:outline-none"
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
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "0.75rem",
										color: value.includes(tag)
											? "var(--color-accent-gold)"
											: "var(--color-text-secondary)",
									}}
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
			onClick={() => onChange(isActive ? undefined : true)}
			className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors duration-100 focus:outline-none"
			style={isActive ? activePillStyle : defaultPillStyle}
		>
			<Flag size={12} />
			<span style={{ fontFamily: "var(--font-body)" }}>Follow-up</span>
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

	return (
		<dialog
			open
			className="fixed inset-0 z-50 m-0 flex max-w-none items-end border-0 bg-transparent p-0"
		>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop is aria-hidden; Escape is handled on the dialog */}
			<div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden={true} />

			{/* Sheet */}
			<div
				className="relative w-full rounded-t-2xl px-4 pb-8 pt-4"
				style={{ background: "var(--color-bg-overlay)", maxHeight: "85vh", overflowY: "auto" }}
			>
				{/* Handle */}
				<div
					className="mx-auto mb-4 h-1 w-10 rounded-full"
					style={{ background: "var(--color-border-default)" }}
				/>

				<div className="mb-4 flex items-center justify-between">
					<span
						style={{
							fontFamily: "var(--font-display)",
							fontSize: "1rem",
							color: "var(--color-text-primary)",
						}}
					>
						Filters
					</span>
					<button
						type="button"
						onClick={onClose}
						className="focus:outline-none"
						style={{ color: "var(--color-text-muted)" }}
					>
						<X size={18} />
					</button>
				</div>

				<div className="flex flex-col gap-4">
					{/* Sort */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Sort
						</p>
						<VaultSort value={sortValue} onChange={onSortChange} />
					</div>

					{/* Method */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Research Method
						</p>
						<MethodFilter
							value={filters.researchMethod ?? []}
							onChange={(v) => onFiltersChange({ ...filters, researchMethod: v })}
						/>
					</div>

					{/* Tone */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Emotional Tone
						</p>
						<ToneFilter
							value={filters.emotionalTone}
							onChange={(v) => onFiltersChange({ ...filters, emotionalTone: v })}
						/>
					</div>

					{/* Date */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Date Range
						</p>
						<DateFilter
							dateFrom={filters.dateFrom}
							dateTo={filters.dateTo}
							onChange={(from, to) => onFiltersChange({ ...filters, dateFrom: from, dateTo: to })}
						/>
					</div>

					{/* Follow-up */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Flags
						</p>
						<FollowUpFilter
							value={filters.followUpNeeded}
							onChange={(v) => onFiltersChange({ ...filters, followUpNeeded: v })}
						/>
					</div>

					{/* Tags */}
					<div>
						<p
							className="mb-2"
							style={{
								fontFamily: "var(--font-mono)",
								fontSize: "0.65rem",
								color: "var(--color-text-muted)",
								textTransform: "uppercase",
								letterSpacing: "0.08em",
							}}
						>
							Tags
						</p>
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
							className="flex-1 rounded-xl py-2.5 transition-colors duration-150 hover:bg-white/5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.875rem",
								color: "var(--color-text-muted)",
								border: "1px solid var(--color-border-default)",
							}}
						>
							Clear all
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="flex-1 rounded-xl py-2.5 font-semibold transition-all duration-150 hover:brightness-110 focus:outline-none"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.875rem",
							background: "var(--color-accent-gold)",
							color: "var(--color-text-inverse)",
						}}
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
					<SlidersHorizontal
						size={14}
						style={{ color: "var(--color-text-muted)", flexShrink: 0 }}
					/>

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
							className="transition-opacity duration-100 hover:opacity-70 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.75rem",
								color: "var(--color-text-muted)",
								textDecoration: "underline",
							}}
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
					className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors duration-100 focus:outline-none"
					style={hasActiveFilters ? activePillStyle : defaultPillStyle}
				>
					<Filter size={13} />
					<span style={{ fontFamily: "var(--font-body)", fontSize: "0.8125rem" }}>Filters</span>
					{filterCount > 0 && (
						<span
							className="flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[0.6rem] font-bold"
							style={{ background: "var(--color-accent-gold)", color: "var(--color-text-inverse)" }}
						>
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
