import { Skeleton } from "@/components/ui/skeleton";

export default function TeamLoading() {
	return (
		<div className="flex h-full flex-col gap-6 p-6">
			{/* Header: title + invite button */}
			<div className="flex items-center justify-between">
				<Skeleton className="h-8 w-40" />
				<Skeleton className="h-9 w-36" style={{ borderRadius: "var(--radius-md)" }} />
			</div>

			{/* Stats cards */}
			<div className="flex gap-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<Skeleton key={i} className="h-20 flex-1" style={{ borderRadius: "var(--radius-lg)" }} />
				))}
			</div>

			{/* Member table */}
			<div className="grid gap-2">
				<Skeleton className="h-10 w-full" style={{ borderRadius: "var(--radius-md)" }} />
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton
						key={i}
						className="h-14 w-full"
						style={{ borderRadius: "var(--radius-md)" }}
					/>
				))}
			</div>
		</div>
	);
}
