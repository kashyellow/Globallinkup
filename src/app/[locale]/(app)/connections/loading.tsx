import { PageSkeleton, CardGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function ConnectionsLoading() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-space-lg">
        <Skeleton className="h-20 w-full rounded-[1.25rem]" />
        <CardGridSkeleton count={4} />
      </div>
    </PageSkeleton>
  );
}
