import { PageSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function PostDetailLoading() {
  return (
    <PageSkeleton>
      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-space-lg">
        <Skeleton className="h-11 w-24 rounded-full" />
        <div className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low">
          <div className="flex items-center gap-3 p-space-lg">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-space-md p-space-lg">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
        <Skeleton className="h-64 w-full rounded-[1.25rem]" />
      </div>
    </PageSkeleton>
  );
}
