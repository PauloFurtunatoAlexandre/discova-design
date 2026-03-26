"use client";

import { deleteMapNodeAction } from "@/actions/map";
import type { MapNodeData } from "@/lib/map/types";
import { Trash2 } from "lucide-react";
import { useState, useTransition } from "react";

interface NodeContextMenuProps {
	node: MapNodeData;
	workspaceId: string;
	projectId: string;
	onClose: () => void;
}

export function NodeContextMenu({ node, workspaceId, projectId, onClose }: NodeContextMenuProps) {
	const [isPending, startTransition] = useTransition();
	const [confirmDelete, setConfirmDelete] = useState(false);

	function handleDelete() {
		if (!confirmDelete) {
			setConfirmDelete(true);
			return;
		}

		startTransition(async () => {
			await deleteMapNodeAction({
				workspaceId,
				projectId,
				nodeId: node.id,
			});
			onClose();
		});
	}

	return (
		<div
			className="flex flex-col gap-0.5 rounded-lg p-1.5"
			style={{
				backgroundColor: "var(--color-bg-overlay)",
				border: "1px solid var(--color-border-default)",
				boxShadow: "var(--shadow-md)",
				minWidth: 160,
			}}
		>
			<button
				type="button"
				onClick={handleDelete}
				disabled={isPending}
				className="flex items-center gap-2 rounded-md px-3 py-2 text-left transition-colors"
				style={{
					fontFamily: "var(--font-body)",
					fontSize: "var(--text-xs)",
					color: confirmDelete ? "var(--color-status-error)" : "var(--color-text-primary)",
					backgroundColor: "transparent",
				}}
			>
				<Trash2 size={14} />
				{isPending ? "Deleting..." : confirmDelete ? "Click again to confirm" : "Delete node"}
			</button>
		</div>
	);
}
