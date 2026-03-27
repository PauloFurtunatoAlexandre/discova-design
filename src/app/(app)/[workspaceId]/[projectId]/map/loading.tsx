import { Skeleton } from "@/components/ui/skeleton";

export default function MapLoading() {
	return (
		<div className="relative flex h-full flex-col">
			{/* Toolbar */}
			<div className="flex items-center gap-3 border-b px-4 py-2" style={{ borderColor: "var(--color-border-subtle)" }}>
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-8" style={{ borderRadius: "var(--radius-md)" }} />
				))}
				<div className="flex-1" />
				<Skeleton className="h-8 w-32" style={{ borderRadius: "var(--radius-md)" }} />
			</div>

			{/* Canvas area */}
			<div className="flex-1" style={{ background: "var(--color-bg-sunken)" }}>
				<div className="flex h-full items-center justify-center">
					<Skeleton className="h-6 w-48 opacity-50" style={{ borderRadius: "var(--radius-md)" }} />
				</div>
			</div>
		</div>
	);
}
