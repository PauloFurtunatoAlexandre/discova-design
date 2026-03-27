import { Skeleton } from "@/components/ui/skeleton";

export default function VaultLoading() {
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header: title + search + add button */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-48" />
				<div className="flex gap-3">
					<Skeleton className="h-9 w-64" style={{ borderRadius: "var(--radius-md)" }} />
					<Skeleton className="h-9 w-32" style={{ borderRadius: "var(--radius-md)" }} />
				</div>
			</div>

			{/* Filter bar */}
			<div className="flex gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-8 w-24" style={{ borderRadius: "var(--radius-full)" }} />
				))}
			</div>

			{/* Note cards */}
			<div className="grid gap-3">
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-28 w-full"
						style={{ borderRadius: "var(--radius-lg)" }}
					/>
				))}
			</div>
		</div>
	);
}
