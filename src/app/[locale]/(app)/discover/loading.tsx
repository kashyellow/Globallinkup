import { PageSkeleton, CardGridSkeleton } from "@/components/ui/skeleton";

export default function DiscoverLoading() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-space-lg">
        <div className="h-12 w-full rounded-full bg-surface-container-highest/70" />
        <CardGridSkeleton count={4} />
      </div>
    </PageSkeleton>
  );
}
