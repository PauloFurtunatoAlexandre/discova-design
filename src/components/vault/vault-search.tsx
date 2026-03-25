"use client";

import { Loader2, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface VaultSearchProps {
	value: string;
	onChange: (value: string) => void;
	isSearching?: boolean;
}

export function VaultSearch({ value, onChange, isSearching = false }: VaultSearchProps) {
	const inputRef = useRef<HTMLInputElement>(null);

	// ⌘K shortcut to focus search
	useEffect(() => {
		function handleKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault();
				inputRef.current?.focus();
			}
		}
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, []);

	return (
		<div className="relative flex min-h-[44px] w-full items-center gap-2 rounded-xl border border-[--color-border-default] bg-[--color-bg-sunken] px-3 transition-all duration-150 focus-within:border-[--color-border-strong] focus-within:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]">
			{/* Left icon */}
			<span className="shrink-0 text-[--color-text-muted]">
				{isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
			</span>

			{/* Input */}
			<input
				ref={inputRef}
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Search notes, participants, quotes..."
				className="flex-1 bg-transparent font-body text-sm text-[--color-text-primary] outline-none placeholder:opacity-50"
			/>

			{/* ⌘K badge (when empty) */}
			{!value && (
				<kbd className="hidden shrink-0 items-center gap-0.5 rounded border border-[--color-border-subtle] bg-[--color-bg-raised] px-1.5 py-0.5 font-mono text-[0.7rem] text-[--color-text-muted] sm:flex">
					<span>⌘</span>K
				</kbd>
			)}

			{/* Clear button (when non-empty) */}
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="shrink-0 rounded text-[--color-text-muted] transition-opacity duration-100 hover:opacity-70 focus:outline-none"
					aria-label="Clear search"
				>
					<X size={15} />
				</button>
			)}
		</div>
	);
}
