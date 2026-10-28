import { Skeleton } from "@/components/ui/skeleton";

export default function GlobalLoading() {
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Header shimmer */}
      <div className="mb-8 space-y-3 border-b border-border/80 pb-6">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-10 w-3/4 max-w-lg rounded-lg" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>

      {/* Content grid shimmer */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-base space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <Skeleton className="h-6 w-5/6 rounded" />
            <Skeleton className="h-16 w-full rounded" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
