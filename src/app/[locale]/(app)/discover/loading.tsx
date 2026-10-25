import { PageSkeleton, CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-space-lg">
        <Skeleton className="h-12 w-full rounded-full" />
        <CardGridSkeleton count={4} />
      </div>
    </PageSkeleton>
  );
}
