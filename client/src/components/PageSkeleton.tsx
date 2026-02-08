import { Skeleton } from "@/components/ui/skeleton";

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 h-16 flex items-center px-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-28 ml-2" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20 px-4">
        <Skeleton className="h-8 w-48 rounded-full mb-8" />
        <Skeleton className="h-12 w-80 max-w-full mb-4" />
        <Skeleton className="h-6 w-96 max-w-full mb-2" />
        <Skeleton className="h-6 w-72 max-w-full mb-8" />
        <div className="flex gap-4">
          <Skeleton className="h-12 w-36 rounded-lg" />
          <Skeleton className="h-12 w-36 rounded-lg" />
        </div>
      </div>

      <div className="container px-4 py-12">
        <div className="flex flex-col items-center mb-10">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-10 w-full max-w-md mb-6" />
          <div className="flex gap-2 flex-wrap justify-center">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-9 w-24 rounded-full" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 sm:h-44 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ToolPageSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 h-16 flex items-center px-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-28 ml-2" />
      </div>
      <div className="container px-4 py-8 max-w-5xl mx-auto">
        <Skeleton className="h-5 w-28 mb-6" />
        <div className="flex flex-col items-center mb-8">
          <Skeleton className="h-10 w-64 mb-3" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 h-16 flex items-center px-4">
        <Skeleton className="h-9 w-9 rounded-lg" />
        <Skeleton className="h-5 w-28 ml-2" />
      </div>
      <div className="container px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
