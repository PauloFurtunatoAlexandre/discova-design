"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { MapData } from "@/lib/map/types";
import type { UnplacedInsight } from "@/lib/queries/map";
import dynamic from "next/dynamic";

const MapCanvas = dynamic(() => import("@/components/map/map-canvas").then((m) => m.MapCanvas), {
	ssr: false,
	loading: () => (
		<div
			className="flex h-full items-center justify-center"
			style={{ background: "var(--color-bg-sunken)" }}
		>
			<Skeleton className="h-6 w-48" style={{ borderRadius: "var(--radius-md)" }} />
		</div>
	),
});

interface MapCanvasLazyProps {
	mapData: MapData;
	canEdit: boolean;
	workspaceId: string;
	projectId: string;
	unplacedInsights: UnplacedInsight[];
}

export function MapCanvasLazy(props: MapCanvasLazyProps) {
	return <MapCanvas {...props} />;
}
