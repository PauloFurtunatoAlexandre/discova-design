"use client";

import type { Editor } from "@tiptap/react";
import {
	Bold,
	Heading1,
	Heading2,
	Heading3,
	Italic,
	List,
	ListOrdered,
	Minus,
	Quote,
} from "lucide-react";

interface ToolbarButtonProps {
	onClick: () => void;
	isActive?: boolean;
	title: string;
	children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault(); // Keep editor focused
				onClick();
			}}
			title={title}
			className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-100 focus:outline-none focus-visible:ring-1"
			style={{
				color: isActive ? "var(--color-accent-gold)" : "var(--color-text-muted)",
				background: isActive ? "var(--color-accent-gold-muted)" : "transparent",
			}}
			onMouseEnter={(e) => {
				if (!isActive) {
					(e.currentTarget as HTMLElement).style.color = "var(--color-text-primary)";
					(e.currentTarget as HTMLElement).style.background = "var(--color-bg-overlay)";
				}
			}}
			onMouseLeave={(e) => {
				if (!isActive) {
					(e.currentTarget as HTMLElement).style.color = "var(--color-text-muted)";
					(e.currentTarget as HTMLElement).style.background = "transparent";
				}
			}}
		>
			{children}
		</button>
	);
}

function Separator() {
	return (
		<span
			className="mx-1 inline-block h-4 w-px shrink-0"
			style={{ background: "var(--color-border-subtle)" }}
		/>
	);
}

interface NoteEditorToolbarProps {
	editor: Editor;
}

export function NoteEditorToolbar({ editor }: NoteEditorToolbarProps) {
	return (
		<div
			className="flex items-center gap-0.5 overflow-x-auto px-4"
			style={{
				background: "var(--color-bg-raised)",
				borderBottom: "1px solid var(--color-border-subtle)",
				height: "40px",
				minHeight: "40px",
			}}
		>
			{/* Group 1: Text formatting */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBold().run()}
				isActive={editor.isActive("bold")}
				title="Bold"
			>
				<Bold size={15} strokeWidth={2} />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleItalic().run()}
				isActive={editor.isActive("italic")}
				title="Italic"
			>
				<Italic size={15} strokeWidth={2} />
			</ToolbarButton>

			<Separator />

			{/* Group 2: Headings */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
				isActive={editor.isActive("heading", { level: 1 })}
				title="Heading 1"
			>
				<Heading1 size={15} strokeWidth={2} />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
				isActive={editor.isActive("heading", { level: 2 })}
				title="Heading 2"
			>
				<Heading2 size={15} strokeWidth={2} />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
				isActive={editor.isActive("heading", { level: 3 })}
				title="Heading 3"
			>
				<Heading3 size={15} strokeWidth={2} />
			</ToolbarButton>

			<Separator />

			{/* Group 3: Lists */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBulletList().run()}
				isActive={editor.isActive("bulletList")}
				title="Bullet List"
			>
				<List size={15} strokeWidth={2} />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().toggleOrderedList().run()}
				isActive={editor.isActive("orderedList")}
				title="Ordered List"
			>
				<ListOrdered size={15} strokeWidth={2} />
			</ToolbarButton>

			<Separator />

			{/* Group 4: Block */}
			<ToolbarButton
				onClick={() => editor.chain().focus().toggleBlockquote().run()}
				isActive={editor.isActive("blockquote")}
				title="Blockquote"
			>
				<Quote size={15} strokeWidth={2} />
			</ToolbarButton>

			<ToolbarButton
				onClick={() => editor.chain().focus().setHorizontalRule().run()}
				title="Horizontal Rule"
			>
				<Minus size={15} strokeWidth={2} />
			</ToolbarButton>
		</div>
	);
}
