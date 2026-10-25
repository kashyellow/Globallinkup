import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Shimmer placeholder for server-rendered route fallbacks and media.
 *
 * `[animation-delay:150ms]` keeps a fast response from flashing a skeleton for
 * one frame; `motion-reduce` removes the pulse entirely.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse rounded-md bg-surface-container-highest/70 [animation-delay:150ms] motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** A stack of text lines with a shorter last line, used inside card skeletons. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <span className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </span>
  );
}

/** Generic page shell so every route fallback keeps the same rhythm. */
export function PageSkeleton({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col gap-space-sm">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-2/3 max-w-md" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="mt-space-xl">{children}</div>
    </div>
  );
}

/** Two-column card grid used by Discover and Connections fallbacks. */
export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="flex flex-col gap-space-sm p-space-md">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-space-xs h-10 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Feed fallback: composer + tall post cards + sidebar. */
export function FeedSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-8">
          <div className="rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-md">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-11 w-28 rounded-full" />
              <Skeleton className="h-11 w-36 rounded-full" />
              <Skeleton className="h-11 w-32 rounded-full" />
            </div>
          </div>
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low"
            >
              <div className="flex items-center gap-3 p-space-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="flex flex-col gap-space-sm p-space-lg">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-space-lg lg:col-span-4">
          <Skeleton className="h-48 w-full rounded-[1.25rem]" />
          <Skeleton className="h-40 w-full rounded-[1.25rem]" />
        </div>
      </div>
    </PageSkeleton>
  );
}

/** Long persona form shared by onboarding and profile editing. */
export function PersonaFormSkeleton({ showPipeline = true }: { showPipeline?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl lg:px-margin">
      <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-1.5 w-1.5 rounded-full" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-10 w-full max-w-md sm:h-12" />
        </div>
        {showPipeline ? (
          <div className="flex flex-wrap items-center gap-space-sm rounded-xl border border-outline-variant bg-surface-low px-space-md py-space-sm">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-space-lg rounded-xl border border-outline-variant bg-surface-container p-space-lg shadow-sm md:gap-space-xl md:p-space-xl">
          <Skeleton className="h-4 w-56 max-w-full" />

          <div className="flex flex-col gap-space-md">
            <div className="flex items-center justify-between gap-space-sm">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
            <div className="flex flex-col items-center gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg sm:flex-row">
              <Skeleton className="h-28 w-28 rounded-full" />
              <div className="flex w-full flex-col gap-space-xs">
                <div className="flex flex-wrap gap-space-xs">
                  <Skeleton className="h-11 w-36 rounded-lg" />
                  <Skeleton className="h-11 w-32 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-11 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
            <div className="grid grid-cols-1 gap-space-xs sm:grid-cols-2">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-space-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-56 max-w-full" />
              </div>
              <Skeleton className="h-5 w-16 rounded-lg" />
            </div>
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>

          <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant bg-surface-container p-space-lg">
            <div className="flex items-center justify-between gap-space-sm">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20 rounded-lg" />
            </div>
            <Skeleton className="h-3 w-full max-w-md" />
            <div className="mt-1 grid grid-cols-1 gap-space-md md:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-11 w-full rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-space-md pt-space-md sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-12 w-full rounded-lg sm:w-40" />
            <Skeleton className="h-12 w-full rounded-lg sm:w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}

/** Asymmetric bento fallback for the marketplace grid. */
export function BentoGridSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low"
          >
            <Skeleton className="aspect-[4/3] w-full rounded-none" />
            <div className="flex flex-col gap-space-sm p-space-md">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-9 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </PageSkeleton>
  );
}

/** Dossier fallback: action bar, identity, bio, contact locker and archive. */
export function DossierSkeleton() {
  return (
    <div className="dossier-backdrop flex w-full flex-col">
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile md:px-margin md:pt-block">
        <div className="flex justify-end border-y border-outline-variant py-space-sm">
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-11 w-24 rounded-md" />
            <Skeleton className="h-11 w-24 rounded-md" />
            <Skeleton className="h-11 w-24 rounded-md" />
          </div>
        </div>

        <div className="mt-space-lg">
          <Skeleton className="h-3 w-20" />
          <div className="mt-space-md grid grid-cols-1 gap-space-lg lg:grid-cols-12 lg:items-end">
            <div className="flex flex-col gap-space-sm lg:col-span-7">
              <Skeleton className="h-12 w-80 max-w-full" />
              <Skeleton className="h-5 w-64 max-w-full" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <Skeleton className="mx-auto aspect-[4/5] w-full max-w-[19rem] rounded-none lg:mx-0 lg:ml-auto lg:max-w-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-5">
            <div className="flex flex-col gap-space-md">
              <Skeleton className="h-3 w-28" />
              <SkeletonText lines={4} />
              <div className="flex flex-wrap gap-1.5">
                <Skeleton className="h-7 w-20 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            </div>
            <div className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-md" />
              ))}
              <Skeleton className="mt-space-xs h-8 w-40 rounded-md" />
            </div>
          </div>

          <div className="flex flex-col gap-space-md lg:col-span-7">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-56 max-w-full" />
            <div className="flex gap-space-md border-b border-outline-variant pb-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="flex flex-col gap-space-sm p-space-md">
                    <Skeleton className="h-3 w-20" />
                    <SkeletonText lines={2} />
                    <Skeleton className="mt-space-xs h-8 w-full rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Admin shell fallback. The admin layout renders its own header and tabs. */
export function AdminSkeleton({ variant = "list" }: { variant?: "dashboard" | "list" }) {
  if (variant === "dashboard") {
    return (
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="flex max-w-2xl flex-col gap-space-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>

        <div className="mt-space-xl grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="flex flex-col gap-space-lg rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-lg"
            >
              <div className="flex items-start justify-between gap-space-sm">
                <Skeleton className="h-11 w-11 rounded-full" />
                <Skeleton className="h-5 w-5" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-space-xl rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-lg">
          <div className="grid grid-cols-2 gap-space-md sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div className="flex max-w-2xl flex-col gap-space-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-xl" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="mt-space-lg rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-md md:p-space-lg">
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-space-xs sm:flex-row">
              <Skeleton className="h-11 w-full flex-1 rounded-full" />
              <div className="flex gap-space-xs">
                <Skeleton className="h-11 w-24 rounded-full" />
                <Skeleton className="h-11 w-20 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex gap-1.5 overflow-hidden">
            <Skeleton className="h-10 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-20 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-24 shrink-0 rounded-full" />
            <Skeleton className="h-10 w-16 shrink-0 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mt-space-md flex flex-col gap-space-md">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex flex-col items-start justify-between gap-space-lg rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-lg lg:flex-row lg:items-center"
          >
            <div className="flex w-full items-center gap-space-md">
              <Skeleton className="h-24 w-20 shrink-0 rounded-2xl" />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <Skeleton className="h-5 w-48 max-w-full" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full max-w-md" />
              </div>
            </div>
            <div className="flex w-full shrink-0 gap-space-sm lg:w-auto">
              <Skeleton className="h-11 w-28 rounded-full" />
              <Skeleton className="h-11 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
