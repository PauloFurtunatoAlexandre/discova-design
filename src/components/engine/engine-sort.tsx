"use client";

import type { EngineListFilters } from "@/lib/queries/engine-list";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

export type EngineSortValue = NonNullable<EngineListFilters["sortBy"]>;

const SORT_OPTIONS: { value: EngineSortValue; label: string }[] = [
	{ value: "confidence_desc", label: "Highest confidence" },
	{ value: "confidence_asc", label: "Lowest confidence" },
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
	{ value: "recently_modified", label: "Recently modified" },
];

interface EngineSortProps {
	value: EngineSortValue;
	onChange: (sort: EngineSortValue) => void;
}

export function EngineSort({ value, onChange }: EngineSortProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Highest confidence";

	function handleSelect(sort: EngineSortValue) {
		onChange(sort);
		setOpen(false);
	}

	function handleBlur(e: React.FocusEvent) {
		if (!containerRef.current?.contains(e.relatedTarget as Node)) {
			setOpen(false);
		}
	}

	return (
		<div ref={containerRef} className="relative shrink-0" onBlur={handleBlur}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-label="Sort insights"
				className="filter-pill flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-body text-xs transition-colors duration-100 hover:bg-[--color-bg-item-hover] focus:outline-none"
			>
				<ArrowUpDown size={13} />
				<span>{selectedLabel}</span>
				<ChevronDown
					size={12}
					className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
				/>
			</button>

			{open && (
				<div className="dropdown-panel absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl py-1">
					{SORT_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							aria-pressed={value === opt.value}
							onClick={() => handleSelect(opt.value)}
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
