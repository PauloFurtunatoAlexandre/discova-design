"use client";

import { createCommentAction, deleteCommentAction, updateCommentAction } from "@/actions/comments";
import type { CommentThread } from "@/lib/queries/comments";
import { formatRelativeTime } from "@/lib/utils/dates";
import { AnimatePresence, motion } from "framer-motion";
import { MessageSquare, Pencil, Reply, Send, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

// ── Props ────────────────────────────────────────────────────────────────────

interface CommentPanelProps {
	threads: CommentThread[];
	projectId: string;
	workspaceId: string;
	targetType: "insight" | "problem" | "solution" | "stack_item";
	targetId: string;
	currentUserId: string;
}

export function CommentPanel({
	threads,
	projectId,
	workspaceId,
	targetType,
	targetId,
	currentUserId,
}: CommentPanelProps) {
	const router = useRouter();
	const [newComment, setNewComment] = useState("");
	const [isPending, startTransition] = useTransition();
	const inputRef = useRef<HTMLTextAreaElement>(null);

	function handleSubmit() {
		if (!newComment.trim()) return;
		startTransition(async () => {
			const result = await createCommentAction({
				projectId,
				workspaceId,
				targetType,
				targetId,
				parentId: null,
				content: newComment.trim(),
			});
			if ("success" in result) {
				setNewComment("");
				router.refresh();
			}
		});
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center gap-2">
				<MessageSquare size={16} style={{ color: "var(--color-text-muted)" }} />
				<span
					className="text-xs font-medium uppercase"
					style={{
						fontFamily: "var(--font-mono)",
						color: "var(--color-text-muted)",
						letterSpacing: "var(--tracking-wide)",
					}}
				>
					Comments ({threads.reduce((n, t) => n + 1 + t.replies.length, 0)})
				</span>
			</div>

			{/* Threads */}
			<div className="space-y-3">
				<AnimatePresence mode="popLayout">
					{threads.map((thread) => (
						<motion.div
							key={thread.id}
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ type: "spring", stiffness: 400, damping: 30 }}
						>
							<ThreadItem
								thread={thread}
								projectId={projectId}
								workspaceId={workspaceId}
								targetType={targetType}
								targetId={targetId}
								currentUserId={currentUserId}
							/>
						</motion.div>
					))}
				</AnimatePresence>
			</div>

			{/* New comment input */}
			<div
				className="flex gap-2"
				style={{
					borderTop: threads.length > 0 ? "1px solid var(--color-border-subtle)" : "none",
					paddingTop: threads.length > 0 ? 12 : 0,
				}}
			>
				<textarea
					ref={inputRef}
					value={newComment}
					onChange={(e) => setNewComment(e.target.value)}
					placeholder="Write a comment..."
					rows={2}
					className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors focus:border-[--color-border-focus] focus:shadow-[0_0_0_3px_var(--color-accent-gold-focus-ring)]"
					style={{
						backgroundColor: "var(--color-bg-sunken)",
						border: "1px solid var(--color-border-default)",
						color: "var(--color-text-primary)",
					}}
					onKeyDown={(e) => {
						if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
							e.preventDefault();
							handleSubmit();
						}
					}}
				/>
				<button
					type="button"
					onClick={handleSubmit}
					disabled={isPending || !newComment.trim()}
					className="self-end rounded-lg p-2.5 transition-opacity hover:opacity-80 disabled:opacity-40"
					style={{
						backgroundColor: "var(--color-accent-blue)",
						color: "var(--color-text-inverse)",
					}}
					aria-label="Post comment"
				>
					<Send size={16} />
				</button>
			</div>
		</div>
	);
}

// ── Thread Item ──────────────────────────────────────────────────────────────

function ThreadItem({
	thread,
	projectId,
	workspaceId,
	targetType,
	targetId,
	currentUserId,
}: {
	thread: CommentThread;
	projectId: string;
	workspaceId: string;
	targetType: "insight" | "problem" | "solution" | "stack_item";
	targetId: string;
	currentUserId: string;
}) {
	const router = useRouter();
	const [replyOpen, setReplyOpen] = useState(false);
	const [replyText, setReplyText] = useState("");
	const [isPending, startTransition] = useTransition();

	function handleReply() {
		if (!replyText.trim()) return;
		startTransition(async () => {
			const result = await createCommentAction({
				projectId,
				workspaceId,
				targetType,
				targetId,
				parentId: thread.id,
				content: replyText.trim(),
			});
			if ("success" in result) {
				setReplyText("");
				setReplyOpen(false);
				router.refresh();
			}
		});
	}

	return (
		<div
			className="rounded-lg"
			style={{
				backgroundColor: "var(--color-bg-surface)",
				border: "1px solid var(--color-border-subtle)",
			}}
		>
			{/* Top-level comment */}
			<CommentBubble
				id={thread.id}
				content={thread.content}
				authorName={thread.authorName}
				authorAvatar={thread.authorAvatar}
				createdAt={thread.createdAt}
				updatedAt={thread.updatedAt}
				isOwn={thread.authorId === currentUserId}
				workspaceId={workspaceId}
				onReply={() => setReplyOpen(!replyOpen)}
			/>

			{/* Replies */}
			{thread.replies.length > 0 && (
				<div
					className="ml-6 space-y-0"
					style={{ borderTop: "1px solid var(--color-border-subtle)" }}
				>
					{thread.replies.map((reply) => (
						<CommentBubble
							key={reply.id}
							id={reply.id}
							content={reply.content}
							authorName={reply.authorName}
							authorAvatar={reply.authorAvatar}
							createdAt={reply.createdAt}
							updatedAt={reply.updatedAt}
							isOwn={reply.authorId === currentUserId}
							workspaceId={workspaceId}
							isReply
						/>
					))}
				</div>
			)}

			{/* Reply input */}
			<AnimatePresence>
				{replyOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.15 }}
						className="overflow-hidden"
					>
						<div
							className="flex gap-2 px-4 py-3"
							style={{ borderTop: "1px solid var(--color-border-subtle)" }}
						>
							<textarea
								value={replyText}
								onChange={(e) => setReplyText(e.target.value)}
								placeholder="Write a reply..."
								rows={1}
								className="flex-1 px-3 py-2 rounded-lg text-sm outline-none resize-none transition-colors focus:border-[--color-border-focus]"
								style={{
									backgroundColor: "var(--color-bg-sunken)",
									border: "1px solid var(--color-border-default)",
									color: "var(--color-text-primary)",
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
										e.preventDefault();
										handleReply();
									}
								}}
							/>
							<button
								type="button"
								onClick={handleReply}
								disabled={isPending || !replyText.trim()}
								className="self-end rounded-lg p-2 transition-opacity hover:opacity-80 disabled:opacity-40"
								style={{
									backgroundColor: "var(--color-accent-blue)",
									color: "var(--color-text-inverse)",
								}}
								aria-label="Post reply"
							>
								<Send size={14} />
							</button>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ── Comment Bubble ───────────────────────────────────────────────────────────

function CommentBubble({
	id,
	content,
	authorName,
	authorAvatar,
	createdAt,
	updatedAt,
	isOwn,
	workspaceId,
	onReply,
	isReply,
}: {
	id: string;
	content: string;
	authorName: string;
	authorAvatar: string | null;
	createdAt: Date;
	updatedAt: Date;
	isOwn: boolean;
	workspaceId: string;
	onReply?: () => void;
	isReply?: boolean | undefined;
}) {
	const router = useRouter();
	const [editing, setEditing] = useState(false);
	const [editText, setEditText] = useState(content);
	const [isPending, startTransition] = useTransition();
	const wasEdited = new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;

	function handleSaveEdit() {
		if (!editText.trim()) return;
		startTransition(async () => {
			const result = await updateCommentAction({
				commentId: id,
				workspaceId,
				content: editText.trim(),
			});
			if ("success" in result) {
				setEditing(false);
				router.refresh();
			}
		});
	}

	function handleDelete() {
		startTransition(async () => {
			await deleteCommentAction({ commentId: id, workspaceId });
			router.refresh();
		});
	}

	return (
		<div className="px-4 py-3" style={{ opacity: isPending ? 0.5 : 1 }}>
			<div className="flex items-start gap-2.5">
				{/* Avatar */}
				<div
					className="flex-shrink-0 flex items-center justify-center rounded-full text-xs font-semibold"
					style={{
						width: isReply ? 24 : 28,
						height: isReply ? 24 : 28,
						backgroundColor: authorAvatar ? "transparent" : "var(--color-accent-blue-muted)",
						color: "var(--color-accent-blue)",
						border: authorAvatar ? "none" : "1px solid var(--color-accent-blue)",
						overflow: "hidden",
					}}
				>
					{authorAvatar ? (
						<Image src={authorAvatar} alt={authorName} width={32} height={32} className="w-full h-full object-cover" />
					) : (
						authorName.charAt(0).toUpperCase()
					)}
				</div>

				{/* Content */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
							{authorName}
						</span>
						<span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
							{formatRelativeTime(createdAt)}
						</span>
						{wasEdited && (
							<span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
								(edited)
							</span>
						)}
					</div>

					{editing ? (
						<div className="mt-1.5 space-y-2">
							<textarea
								value={editText}
								onChange={(e) => setEditText(e.target.value)}
								rows={2}
								className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none focus:border-[--color-border-focus]"
								style={{
									backgroundColor: "var(--color-bg-sunken)",
									border: "1px solid var(--color-border-default)",
									color: "var(--color-text-primary)",
								}}
							/>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={handleSaveEdit}
									disabled={isPending}
									className="px-3 py-1 rounded text-xs font-medium transition-opacity hover:opacity-80"
									style={{
										backgroundColor: "var(--color-accent-blue)",
										color: "var(--color-text-inverse)",
									}}
								>
									Save
								</button>
								<button
									type="button"
									onClick={() => {
										setEditing(false);
										setEditText(content);
									}}
									className="px-3 py-1 rounded text-xs transition-opacity hover:opacity-70"
									style={{ color: "var(--color-text-muted)" }}
								>
									Cancel
								</button>
							</div>
						</div>
					) : (
						<p
							className="mt-0.5 text-sm whitespace-pre-wrap"
							style={{ color: "var(--color-text-secondary)" }}
						>
							{content}
						</p>
					)}

					{/* Actions */}
					{!editing && (
						<div className="flex items-center gap-3 mt-1.5">
							{onReply && (
								<button
									type="button"
									onClick={onReply}
									className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
									style={{ color: "var(--color-text-muted)" }}
								>
									<Reply size={12} />
									Reply
								</button>
							)}
							{isOwn && (
								<>
									<button
										type="button"
										onClick={() => setEditing(true)}
										className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
										style={{ color: "var(--color-text-muted)" }}
									>
										<Pencil size={12} />
										Edit
									</button>
									<button
										type="button"
										onClick={handleDelete}
										className="inline-flex items-center gap-1 text-xs transition-opacity hover:opacity-70"
										style={{ color: "var(--color-status-error)" }}
									>
										<Trash2 size={12} />
										Delete
									</button>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

