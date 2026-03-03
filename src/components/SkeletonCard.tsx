import { Skeleton } from "@/components/ui/skeleton";

interface SkeletonCardProps {
  viewMode?: "grid" | "list";
}

export const SkeletonCard = ({ viewMode = "grid" }: SkeletonCardProps) => {
  if (viewMode === "list") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        <Skeleton className="w-14 h-14 rounded-[10px] shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-[10px] space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-24" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-5 w-14 rounded-sm" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
};

export const SkeletonSetCard = () => (
  <div className="rounded-xl border border-border bg-card overflow-hidden">
    <div className="flex gap-1 p-1.5">
      <Skeleton className="w-[52%] aspect-square rounded-[8px]" />
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-0.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-sm" />
        ))}
      </div>
    </div>
    <div className="px-3 pt-2 pb-3 space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-3 w-16" />
    </div>
  </div>
);

export const SkeletonHistoryEntry = () => (
  <div className="rounded-xl border border-border bg-card px-4 py-3">
    <div className="flex items-start gap-3">
      <Skeleton className="w-8 h-8 rounded-md shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  </div>
);
