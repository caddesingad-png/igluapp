import { Skeleton } from "@/components/ui/skeleton";

const SkeletonSetDetail = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-40 bg-background border-b border-border" style={{ height: "56px" }}>
      <div className="flex items-center justify-between max-w-lg mx-auto px-4 h-full">
        <Skeleton className="w-8 h-8 rounded-md" />
        <div className="flex gap-1">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </div>
    </header>
    <div className="max-w-lg mx-auto">
      <div className="flex justify-center px-6 pt-6">
        <Skeleton className="w-48 h-48 rounded-xl" />
      </div>
      <div className="px-6 pt-5 pb-4 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="px-6 space-y-2">
        <Skeleton className="h-3 w-16 mb-3" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
            <Skeleton className="w-11 h-11 rounded-[8px]" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonSetDetail;
