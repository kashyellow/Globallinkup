import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-space-lg px-margin-mobile py-space-xl lg:px-margin">
      <Skeleton className="h-8 w-40" />
      <div className="rounded-[1.625rem] border border-outline-variant bg-surface-low p-space-lg">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-space-sm h-4 w-full" />
        <div className="mt-space-lg flex flex-col gap-space-md">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}
