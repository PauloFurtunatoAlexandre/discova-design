"use client";

import type { NoteListItem } from "@/lib/queries/vault-list";
import { Loader2 } from "lucide-react";
import { NoteCard } from "./note-card";

interface VaultListProps {
	notes: NoteListItem[];
	workspaceId: string;
	projectId: string;
	hasMore: boolean;
	isLoading: boolean;
	onLoadMore: () => void;
	totalCount: number;
}

export function VaultList({
	notes,
	workspaceId,
	projectId,
	hasMore,
	isLoading,
	onLoadMore,
	totalCount,
}: VaultListProps) {
	const countLabel = totalCount === 1 ? "1 research note" : `${totalCount} research notes`;

	return (
		<div className="flex flex-col gap-3">
			{/* Header */}
			<p
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "0.875rem",
					color: "var(--color-text-muted)",
				}}
			>
				{countLabel}
			</p>

			{/* Cards */}
			<div className="flex flex-col gap-3">
				{notes.map((note, i) => (
					<NoteCard
						key={note.id}
						note={note}
						workspaceId={workspaceId}
						projectId={projectId}
						index={i}
					/>
				))}
			</div>

			{/* Load more / end */}
			{hasMore ? (
				<button
					type="button"
					onClick={onLoadMore}
					disabled={isLoading}
					className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 transition-colors duration-150 hover:bg-white/5 focus:outline-none disabled:opacity-50"
					style={{
						fontFamily: "var(--font-body)",
						fontSize: "0.875rem",
						color: "var(--color-text-muted)",
						border: "1px solid var(--color-border-default)",
					}}
				>
					{isLoading ? (
						<>
							<Loader2 size={14} className="animate-spin" />
							Loading...
						</>
					) : (
						"Load more"
					)}
				</button>
			) : (
				notes.length > 0 && (
					<p
						className="mt-2 text-center italic"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.75rem",
							color: "var(--color-text-muted)",
						}}
					>
						All notes loaded
					</p>
				)
			)}
		</div>
	);
}
