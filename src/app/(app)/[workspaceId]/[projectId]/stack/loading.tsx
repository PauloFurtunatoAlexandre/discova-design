import { Skeleton } from "@/components/ui/skeleton";

export default function StackLoading() {
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header: title + stats */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-16 w-28" style={{ borderRadius: "var(--radius-lg)" }} />
					))}
				</div>
			</div>

			{/* Sort / filter bar */}
			<div className="flex gap-2">
				<Skeleton className="h-9 w-36" style={{ borderRadius: "var(--radius-md)" }} />
				<Skeleton className="h-9 w-24" style={{ borderRadius: "var(--radius-md)" }} />
			</div>

			{/* Table rows */}
			<div className="grid gap-2">
				{/* Header */}
				<Skeleton className="h-10 w-full" style={{ borderRadius: "var(--radius-md)" }} />
				{/* Rows */}
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-16 w-full"
						style={{ borderRadius: "var(--radius-md)" }}
					/>
				))}
			</div>
		</div>
	);
}
