"use client";

import type { VaultListFilters } from "@/lib/queries/vault-list";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { useRef, useState } from "react";

type SortValue = NonNullable<VaultListFilters["sortBy"]>;

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
	{ value: "newest", label: "Newest first" },
	{ value: "oldest", label: "Oldest first" },
	{ value: "participant_asc", label: "Participant A–Z" },
	{ value: "participant_desc", label: "Participant Z–A" },
	{ value: "quote_count", label: "Most quotes" },
	{ value: "follow_up_first", label: "Follow-up first" },
];

interface VaultSortProps {
	value: SortValue;
	onChange: (sort: SortValue) => void;
}

export function VaultSort({ value, onChange }: VaultSortProps) {
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const selectedLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? "Newest first";

	function handleSelect(sort: SortValue) {
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
				aria-label="Sort notes"
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
				<div className="dropdown-panel absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl py-1">
					{SORT_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							aria-pressed={value === opt.value}
							onClick={() => handleSelect(opt.value)}
							className={`flex w-full items-center px-3 py-2 text-left font-body text-[0.8125rem] transition-colors duration-75 hover:bg-[--color-bg-item-hover] focus:outline-none ${value === opt.value ? "font-medium text-[--color-accent-gold]" : "font-normal text-[--color-text-secondary]"}`}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
