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

	// Close on outside click
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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors duration-100 hover:bg-white/5 focus:outline-none"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.75rem",
					color: "var(--color-text-muted)",
					border: "1px solid var(--color-border-subtle)",
					background: "var(--color-bg-raised)",
				}}
				aria-label="Sort notes"
			>
				<ArrowUpDown size={13} />
				<span>{selectedLabel}</span>
				<ChevronDown
					size={12}
					className="transition-transform duration-150"
					style={{ transform: open ? "rotate(180deg)" : undefined }}
				/>
			</button>

			{open && (
				<div
					className="absolute right-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-xl py-1"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "var(--shadow-modal)",
					}}
				>
					{SORT_OPTIONS.map((opt) => (
						<button
							key={opt.value}
							type="button"
							onClick={() => handleSelect(opt.value)}
							className="flex w-full items-center px-3 py-2 text-left transition-colors duration-75 hover:bg-white/5 focus:outline-none"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color:
									value === opt.value ? "var(--color-accent-gold)" : "var(--color-text-secondary)",
								fontWeight: value === opt.value ? 500 : 400,
							}}
						>
							{opt.label}
						</button>
					))}
				</div>
			)}
		</div>
	);
}
