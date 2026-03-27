import { Skeleton } from "@/components/ui/skeleton";

export default function EngineLoading() {
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header: title + search */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-56" />
				<Skeleton className="h-9 w-64" style={{ borderRadius: "var(--radius-md)" }} />
			</div>

			{/* Filter chips */}
			<div className="flex gap-2">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-28" style={{ borderRadius: "var(--radius-full)" }} />
				))}
			</div>

			{/* Insight cards */}
			<div className="grid gap-3">
				{Array.from({ length: 6 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-24 w-full"
						style={{
							borderRadius: "var(--radius-lg)",
							borderLeft: "3px solid var(--color-border-subtle)",
						}}
					/>
				))}
			</div>
		</div>
	);
}
