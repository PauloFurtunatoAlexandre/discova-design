"use client";

import { deleteNoteAction } from "@/actions/vault";
import type { SaveStatus } from "@/hooks/useAutoSave";
import { ArrowLeft, MoreHorizontal, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { SaveIndicator } from "./save-indicator";

interface NoteHeaderProps {
	participantName: string;
	sessionDate: string; // "YYYY-MM-DD"
	workspaceId: string;
	projectId: string;
	noteId: string;
	canEdit: boolean;
	saveStatus: SaveStatus;
	onAnalyse?: (() => void) | undefined;
	isAnalysing?: boolean | undefined;
	showAnalyseAgain?: boolean | undefined;
}

function formatDate(dateStr: string): string {
	const d = new Date(`${dateStr}T12:00:00`);
	return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function NoteHeader({
	participantName,
	sessionDate,
	workspaceId,
	projectId,
	noteId,
	canEdit,
	saveStatus,
	onAnalyse,
	isAnalysing = false,
	showAnalyseAgain = false,
}: NoteHeaderProps) {
	const router = useRouter();
	const [showMenu, setShowMenu] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isPending, startTransition] = useTransition();
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!showMenu) return;
		function handleClickOutside(e: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setShowMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [showMenu]);

	function handleDelete() {
		startTransition(async () => {
			const result = await deleteNoteAction({
				workspaceId,
				projectId,
				noteId,
			});
			if ("success" in result) {
				router.push(`/${workspaceId}/${projectId}/vault`);
			}
		});
	}

	return (
		<>
			<header
				className="flex h-12 items-center gap-3 px-6"
				style={{
					background: "var(--color-bg-surface)",
					borderBottom: "1px solid var(--color-border-subtle)",
					flexShrink: 0,
				}}
			>
				{/* Left: back + title + save indicator */}
				<div className="flex min-w-0 flex-1 items-center gap-3">
					<button
						type="button"
						onClick={() => router.push(`/${workspaceId}/${projectId}/vault`)}
						className="flex items-center gap-1.5 shrink-0 transition-colors duration-150 hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.8125rem",
							color: "var(--color-text-muted)",
						}}
					>
						<ArrowLeft size={14} strokeWidth={2} />
						Vault
					</button>

					<span style={{ color: "var(--color-border-default)" }}>/</span>

					<p
						className="truncate"
						style={{
							fontFamily: "var(--font-body)",
							fontSize: "0.8125rem",
							fontWeight: 600,
							color: "var(--color-text-primary)",
						}}
					>
						{participantName}
						<span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}> · </span>
						<span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>
							{formatDate(sessionDate)}
						</span>
					</p>

					<SaveIndicator status={saveStatus} />
				</div>

				{/* Right: actions */}
				{canEdit && (
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={onAnalyse}
							disabled={isAnalysing}
							className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors duration-150 hover:bg-[--color-accent-blue-muted] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] disabled:cursor-not-allowed disabled:opacity-50"
							style={{
								fontFamily: "var(--font-body)",
								fontSize: "0.8125rem",
								color: "var(--color-accent-blue)",
								border: "1px solid color-mix(in srgb, var(--color-accent-blue) 30%, transparent)",
							}}
						>
							<Sparkles size={13} strokeWidth={2} />
							{isAnalysing ? "Analysing…" : showAnalyseAgain ? "Analyse again" : "Analyse"}
						</button>

						{/* More menu */}
						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setShowMenu((v) => !v)}
								className="flex h-9 w-9 items-center justify-center rounded-md transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
								style={{ color: "var(--color-text-muted)" }}
							>
								<MoreHorizontal size={16} strokeWidth={2} />
							</button>

							{showMenu && (
								<div
									className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg py-1 shadow-lg"
									style={{
										background: "var(--color-bg-raised)",
										border: "1px solid var(--color-border-default)",
										boxShadow: "var(--shadow-modal)",
									}}
									onBlur={() => setShowMenu(false)}
								>
									<button
										type="button"
										onClick={() => {
											setShowMenu(false);
											setShowConfirm(true);
										}}
										className="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-100 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
										style={{ color: "var(--color-status-error)", fontFamily: "var(--font-body)" }}
									>
										<Trash2 size={14} strokeWidth={2} />
										Delete note
									</button>
								</div>
							)}
						</div>
					</div>
				)}
			</header>

			{/* Delete confirmation overlay */}
			{showConfirm && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-[--color-overlay-scrim]">
					<div
						className="mx-4 w-full max-w-sm rounded-2xl p-6"
						style={{
							background: "var(--color-bg-raised)",
							border: "1px solid var(--color-border-default)",
							boxShadow: "var(--shadow-modal)",
						}}
					>
						<h2
							className="mb-2 text-base font-semibold"
							style={{ color: "var(--color-text-primary)", fontFamily: "var(--font-display)" }}
						>
							Delete this note?
						</h2>
						<p
							className="mb-6 text-sm"
							style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
						>
							This will permanently delete the note, all extracted quotes, and any linked evidence.
							This cannot be undone.
						</p>
						<div className="flex justify-end gap-3">
							<button
								type="button"
								onClick={() => setShowConfirm(false)}
								disabled={isPending}
								className="rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 hover:bg-[--color-bg-item-hover] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus] disabled:opacity-40"
								style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-body)" }}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={handleDelete}
								disabled={isPending}
								className="rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[--color-border-focus]"
								style={{
									background: "var(--color-status-error)",
									color: "var(--color-text-inverse)",
									fontFamily: "var(--font-body)",
								}}
							>
								{isPending ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
