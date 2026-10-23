import { Skeleton } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col gap-space-sm">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="mt-space-xl grid grid-cols-1 gap-space-lg md:grid-cols-2">
        <Skeleton className="h-56 w-full rounded-[1.25rem]" />
        <Skeleton className="h-56 w-full rounded-[1.25rem]" />
      </div>
    </div>
  );
}
