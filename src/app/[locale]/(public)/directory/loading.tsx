import { Skeleton } from "@/components/ui/skeleton";

export default function DirectoryLoading() {
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Title Shimmer */}
      <div className="mb-8 space-y-3 border-b border-border/80 pb-6">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-96 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
      </div>

      {/* Search Bar Shimmer */}
      <div className="card-base mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>

      {/* Category Pills Shimmer */}
      <div className="mb-8 flex flex-wrap gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Business Cards Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card-base space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-28 rounded-full" />
              <Skeleton className="h-5 w-20 rounded" />
            </div>
            <Skeleton className="h-6 w-4/5 rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-9 flex-1 rounded-md" />
              <Skeleton className="h-9 flex-1 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
