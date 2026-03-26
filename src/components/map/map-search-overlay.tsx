"use client";

import type { MapNodeData, NodeType } from "@/lib/map/types";
import { NODE_COLORS } from "@/lib/map/types";
import { Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface MapSearchOverlayProps {
	nodes: MapNodeData[];
	onSelectNode: (nodeId: string) => void;
	onClose: () => void;
}

const TYPE_LABELS: Record<NodeType, string> = {
	insight: "Insight",
	problem: "Problem",
	solution: "Solution",
};

export function MapSearchOverlay({ nodes, onSelectNode, onClose }: MapSearchOverlayProps) {
	const [query, setQuery] = useState("");
	const [selectedIndex, setSelectedIndex] = useState(0);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	const filtered = useMemo(() => {
		if (!query.trim()) return nodes.slice(0, 20);
		const q = query.toLowerCase();
		return nodes.filter(
			(n) => n.label.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q),
		);
	}, [nodes, query]);

	// Reset selection when results change
	// biome-ignore lint/correctness/useExhaustiveDependencies: reset index when filtered results change
	useEffect(() => {
		setSelectedIndex(0);
	}, [filtered]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && filtered[selectedIndex]) {
				onSelectNode(filtered[selectedIndex].id);
				onClose();
			} else if (e.key === "Escape") {
				onClose();
			}
		},
		[filtered, selectedIndex, onSelectNode, onClose],
	);

	return (
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
			{/* Backdrop */}
			<button
				type="button"
				className="fixed inset-0 z-[-1]"
				style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
				onClick={onClose}
				aria-label="Close search"
			/>

			{/* Search panel */}
			<div
				className="flex w-full max-w-lg flex-col overflow-hidden rounded-xl"
				style={{
					backgroundColor: "var(--color-bg-surface)",
					border: "1px solid var(--color-border-default)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				{/* Search input */}
				<div
					className="flex items-center gap-3 px-4 py-3"
					style={{ borderBottom: "1px solid var(--color-border-subtle)" }}
				>
					<Search size={18} style={{ color: "var(--color-text-muted)", flexShrink: 0 }} />
					<input
						ref={inputRef}
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Search nodes..."
						className="w-full bg-transparent outline-none"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							color: "var(--color-text-primary)",
						}}
					/>
					<kbd
						style={{
							fontFamily: "var(--font-mono)",
							fontSize: "10px",
							color: "var(--color-text-muted)",
							backgroundColor: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-subtle)",
							borderRadius: "var(--radius-sm)",
							padding: "2px 6px",
							flexShrink: 0,
						}}
					>
						ESC
					</kbd>
				</div>

				{/* Results */}
				<div className="max-h-80 overflow-y-auto py-1">
					{filtered.length === 0 && (
						<p
							className="px-4 py-6 text-center"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "var(--text-sm)",
								color: "var(--color-text-muted)",
							}}
						>
							No nodes found
						</p>
					)}
					{filtered.map((node, i) => {
						const colors = NODE_COLORS[node.type];
						return (
							<button
								key={node.id}
								type="button"
								className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
								style={{
									backgroundColor: i === selectedIndex ? "var(--color-bg-raised)" : "transparent",
								}}
								onClick={() => {
									onSelectNode(node.id);
									onClose();
								}}
								onMouseEnter={() => setSelectedIndex(i)}
							>
								<span
									className="shrink-0 rounded-full"
									style={{
										width: 8,
										height: 8,
										backgroundColor: colors.accent,
									}}
								/>
								<div className="flex min-w-0 flex-1 flex-col">
									<span
										className="truncate"
										style={{
											fontFamily: "var(--font-body)",
											fontSize: "var(--text-sm)",
											color: "var(--color-text-primary)",
											fontWeight: 500,
										}}
									>
										{node.label}
									</span>
									<span
										style={{
											fontFamily: "var(--font-mono)",
											fontSize: "10px",
											color: "var(--color-text-muted)",
											textTransform: "uppercase",
											letterSpacing: "0.05em",
										}}
									>
										{TYPE_LABELS[node.type]}
									</span>
								</div>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}
