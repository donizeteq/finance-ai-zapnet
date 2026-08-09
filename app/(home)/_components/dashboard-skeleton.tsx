import { Skeleton } from "@/app/_components/ui/skeleton";

export const SummaryCardsSkeleton = () => (
  <div className="space-y-6">
    <Skeleton className="h-[120px] w-full rounded-xl" />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
      <Skeleton className="h-[100px] rounded-xl" />
      <Skeleton className="h-[100px] rounded-xl" />
      <Skeleton className="h-[100px] rounded-xl" />
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-3">
    <Skeleton className="h-[300px] rounded-xl" />
    <Skeleton className="h-[300px] rounded-xl md:col-span-2" />
  </div>
);

export const LastTransactionsSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-8 w-48" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-16 w-full rounded-xl" />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="flex h-full flex-col space-y-6 p-6">
    <div className="flex justify-between">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-8 w-32" />
    </div>
    <SummaryCardsSkeleton />
    <div className="grid h-full grid-cols-1 gap-6 md:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-6">
        <ChartSkeleton />
      </div>
      <LastTransactionsSkeleton />
    </div>
  </div>
);
