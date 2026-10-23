import { PageSkeleton } from "@/components/ui/skeleton";

export default function PersonaLoading() {
  return (
    <PageSkeleton>
      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-12">
        <div className="aspect-[4/5] w-full rounded-[1.5rem] bg-surface-container-highest/70 md:col-span-5" />
        <div className="flex flex-col gap-space-sm md:col-span-7">
          <div className="h-10 w-2/3 rounded-md bg-surface-container-highest/70" />
          <div className="h-4 w-1/2 rounded-md bg-surface-container-highest/70" />
          <div className="mt-space-md h-32 w-full rounded-md bg-surface-container-highest/70" />
          <div className="h-11 w-40 rounded-full bg-surface-container-highest/70" />
        </div>
      </div>
    </PageSkeleton>
  );
}
