import { Skeleton } from "@/components/ui/skeleton";

export default function NoticesLoading() {
  return (
    <div className="container mx-auto max-w-screen-xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 space-y-3 border-b border-border/80 pb-6">
        <Skeleton className="h-6 w-36 rounded-full" />
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-4 w-full max-w-md rounded" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card-base space-y-3 p-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-6 w-3/4 rounded" />
            <Skeleton className="h-14 w-full rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
