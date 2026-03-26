"use client";

import { AlertTriangle, Plus, X } from "lucide-react";
import { useState } from "react";

interface MapFabProps {
	onCreateProblem: () => void;
	onCreateSolution: () => void;
}

export function MapFab({ onCreateProblem, onCreateSolution }: MapFabProps) {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="fixed bottom-6 right-6 z-30 flex flex-col-reverse items-end gap-2">
			{/* Main FAB */}
			<button
				type="button"
				onClick={() => setIsOpen((prev) => !prev)}
				aria-label={isOpen ? "Close menu" : "Add node"}
				className="flex h-12 w-12 items-center justify-center rounded-full transition-all duration-150 hover:brightness-110 active:scale-95"
				style={{
					backgroundColor: "var(--color-accent-coral)",
					color: "var(--color-text-inverse)",
					boxShadow: "var(--shadow-lg)",
				}}
			>
				{isOpen ? <X size={20} /> : <Plus size={20} />}
			</button>

			{/* Options */}
			{isOpen && (
				<>
					<button
						type="button"
						onClick={() => {
							onCreateSolution();
							setIsOpen(false);
						}}
						className="flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
						style={{
							backgroundColor: "var(--color-bg-overlay)",
							border: "1px solid var(--color-border-default)",
							boxShadow: "var(--shadow-md)",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						<span
							className="rounded-full"
							style={{
								width: 8,
								height: 8,
								backgroundColor: "var(--color-accent-green)",
							}}
						/>
						Solution
					</button>
					<button
						type="button"
						onClick={() => {
							onCreateProblem();
							setIsOpen(false);
						}}
						className="flex items-center gap-2 rounded-lg px-4 py-2.5 transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
						style={{
							backgroundColor: "var(--color-bg-overlay)",
							border: "1px solid var(--color-border-default)",
							boxShadow: "var(--shadow-md)",
							fontFamily: "var(--font-body)",
							fontSize: "var(--text-sm)",
							fontWeight: 500,
							color: "var(--color-text-primary)",
						}}
					>
						<span
							className="rounded-full"
							style={{
								width: 8,
								height: 8,
								backgroundColor: "var(--color-accent-coral)",
							}}
						/>
						Problem
					</button>
				</>
			)}
		</div>
	);
}
