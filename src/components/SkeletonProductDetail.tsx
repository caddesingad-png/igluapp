import { Skeleton } from "@/components/ui/skeleton";

const SkeletonProductDetail = () => (
  <div className="min-h-screen bg-background">
    {/* Header */}
    <header className="sticky top-0 z-40 bg-background border-b border-border px-4 py-3">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <Skeleton className="w-8 h-8 rounded-md" />
        <div className="flex gap-1">
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
          <Skeleton className="w-8 h-8 rounded-md" />
        </div>
      </div>
    </header>
    <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
      <Skeleton className="w-full aspect-square rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SkeletonProductDetail;
