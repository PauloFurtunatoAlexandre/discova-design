"use client";

import { useEffect, useRef, useState } from "react";

interface ParticipantAutocompleteProps {
	value: string;
	onChange: (value: string) => void;
	projectId: string;
	placeholder?: string;
}

export function ParticipantAutocomplete({
	value,
	onChange,
	projectId,
	placeholder = "e.g., Sarah Chen, Survey Batch 3, Usability Session 5",
}: ParticipantAutocompleteProps) {
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!focused || !value.trim()) {
			setSuggestions([]);
			setOpen(false);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/vault/participants?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(value)}`,
				);
				if (res.ok) {
					const data: string[] = await res.json();
					setSuggestions(data.filter((s) => s !== value));
					setOpen(data.length > 0 && data.some((s) => s !== value));
				}
			} catch {
				// Autocomplete is best-effort
			}
		}, 300);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [value, projectId, focused]);

	// Close on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	function selectSuggestion(name: string) {
		onChange(name);
		setOpen(false);
		setSuggestions([]);
	}

	return (
		<div ref={containerRef} className="relative">
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder={placeholder}
				autoComplete="off"
				className="w-full rounded-lg px-4 py-3 text-sm transition-colors duration-150 focus:outline-none"
				style={{
					background: "var(--color-bg-sunken)",
					border: `1px solid ${focused ? "var(--color-border-strong)" : "var(--color-border-default)"}`,
					color: "var(--color-text-primary)",
				}}
			/>

			{open && suggestions.length > 0 && (
				<ul
					className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg py-1"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
					}}
				>
					{suggestions.slice(0, 5).map((name) => (
						<li key={name}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault(); // don't trigger blur before click
									selectSuggestion(name);
								}}
								className="w-full px-4 py-2 text-left text-sm transition-colors duration-100 hover:bg-[--color-bg-item-hover]"
								style={{ color: "var(--color-text-primary)" }}
							>
								{name}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
