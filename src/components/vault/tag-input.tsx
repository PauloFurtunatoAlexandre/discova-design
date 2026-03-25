"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TagInputProps {
	tags: string[];
	onChange: (tags: string[]) => void;
	projectId: string;
	maxTags?: number;
}

export function TagInput({ tags, onChange, projectId, maxTags = 20 }: TagInputProps) {
	const [input, setInput] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [open, setOpen] = useState(false);
	const [focused, setFocused] = useState(false);
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!focused || !input.trim()) {
			setSuggestions([]);
			setOpen(false);
			return;
		}

		if (debounceRef.current) clearTimeout(debounceRef.current);

		debounceRef.current = setTimeout(async () => {
			try {
				const res = await fetch(
					`/api/vault/tags?projectId=${encodeURIComponent(projectId)}&q=${encodeURIComponent(input)}`,
				);
				if (res.ok) {
					const data: string[] = await res.json();
					const filtered = data.filter((s) => !tags.includes(s));
					setSuggestions(filtered);
					setOpen(filtered.length > 0);
				}
			} catch {
				// Best-effort
			}
		}, 300);

		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current);
		};
	}, [input, projectId, tags, focused]);

	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	function addTag(name: string) {
		const trimmed = name.trim();
		if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return;
		onChange([...tags, trimmed]);
		setInput("");
		setOpen(false);
		setSuggestions([]);
	}

	function removeTag(name: string) {
		onChange(tags.filter((t) => t !== name));
	}

	function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if ((e.key === "Enter" || e.key === ",") && input.trim()) {
			e.preventDefault();
			addTag(input);
		}
		if (e.key === "Backspace" && !input && tags.length > 0) {
			const last = tags[tags.length - 1];
			if (last) removeTag(last);
		}
	}

	return (
		<div ref={containerRef} className="relative">
			<div
				className="flex min-h-[46px] flex-wrap items-center gap-1.5 rounded-lg px-3 py-2 transition-colors duration-150"
				style={{
					background: "var(--color-bg-sunken)",
					border: `1px solid ${focused ? "var(--color-border-strong)" : "var(--color-border-default)"}`,
				}}
			>
				{tags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 rounded-md px-2 py-0.5"
						style={{
							background: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-default)",
							fontFamily: "var(--font-mono)",
							fontSize: "0.75rem",
							color: "var(--color-text-secondary)",
						}}
					>
						{tag}
						<button
							type="button"
							onClick={() => removeTag(tag)}
							className="ml-0.5 rounded hover:opacity-75 focus:outline-none"
							aria-label={`Remove tag ${tag}`}
						>
							<X size={10} />
						</button>
					</span>
				))}

				{tags.length < maxTags && (
					<input
						type="text"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						placeholder={tags.length === 0 ? "Add tags... (Enter or comma to confirm)" : ""}
						className="min-w-[160px] flex-1 bg-transparent text-sm focus:outline-none"
						style={{ color: "var(--color-text-primary)" }}
					/>
				)}
			</div>

			{open && suggestions.length > 0 && (
				<ul
					className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-lg py-1"
					style={{
						background: "var(--color-bg-overlay)",
						border: "1px solid var(--color-border-default)",
						boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
					}}
				>
					{suggestions.slice(0, 8).map((name) => (
						<li key={name}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									addTag(name);
								}}
								className="w-full px-4 py-2 text-left transition-colors duration-100 hover:bg-[--color-bg-item-hover]"
								style={{
									fontFamily: "var(--font-mono)",
									fontSize: "0.75rem",
									color: "var(--color-text-secondary)",
								}}
							>
								{name}
							</button>
						</li>
					))}
				</ul>
			)}

			{tags.length >= maxTags && (
				<p
					className="mt-1.5 text-xs"
					style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-mono)" }}
				>
					Maximum {maxTags} tags reached
				</p>
			)}
		</div>
	);
}
