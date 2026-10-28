import { Skeleton } from "@/components/ui/skeleton";

export default function ComplaintsLoading() {
  return (
    <div className="container mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Title Shimmer */}
      <div className="mb-8 space-y-3 border-b border-border/80 pb-6">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-lg rounded" />
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Form Skeleton */}
        <div className="card-base space-y-5 p-6 sm:p-8 lg:col-span-7">
          <Skeleton className="h-6 w-48 rounded" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-36 rounded" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>
          <Skeleton className="h-11 w-full rounded-md" />
        </div>

        {/* Recent Complaints Skeleton */}
        <div className="space-y-4 lg:col-span-5">
          <Skeleton className="h-6 w-44 rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card-base space-y-2.5 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
              <Skeleton className="h-5 w-3/4 rounded" />
              <Skeleton className="h-12 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
