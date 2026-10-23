import { PageSkeleton, CardGridSkeleton } from "@/components/ui/skeleton";

export default function ConnectionsLoading() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-space-lg">
        <div className="h-20 w-full rounded-[1.25rem] bg-surface-container-highest/70" />
        <CardGridSkeleton count={4} />
      </div>
    </PageSkeleton>
  );
}
