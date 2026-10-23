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
          <div className="rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-lg">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="mt-space-md h-24 w-full rounded-2xl" />
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

/** Asymmetric bento fallback for the marketplace grid. */
export function BentoGridSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-6">
        <Skeleton className="aspect-[16/11] w-full rounded-[1.25rem] sm:col-span-2 lg:col-span-4 lg:row-span-2" />
        <Skeleton className="aspect-[4/3] w-full rounded-[1.25rem] lg:col-span-2" />
        <Skeleton className="aspect-[4/3] w-full rounded-[1.25rem] lg:col-span-2" />
        <Skeleton className="aspect-[4/3] w-full rounded-[1.25rem] lg:col-span-3" />
        <Skeleton className="aspect-[4/3] w-full rounded-[1.25rem] lg:col-span-3" />
      </div>
    </PageSkeleton>
  );
}

/** Dossier fallback: identity header, bio, locker and archive. */
export function DossierSkeleton() {
  return (
    <PageSkeleton>
      <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12">
        <div className="flex flex-col gap-space-lg lg:col-span-5">
          <Skeleton className="h-40 w-full rounded-[1.25rem]" />
          <Skeleton className="h-52 w-full rounded-[1.25rem]" />
        </div>
        <div className="flex flex-col gap-space-md lg:col-span-7">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-64 w-full rounded-[1.25rem]" />
          <Skeleton className="h-40 w-full rounded-[1.25rem]" />
        </div>
      </div>
    </PageSkeleton>
  );
}

/** Admin workstation fallback: metrics, tabs and list rows. */
export function AdminSkeleton() {
  return (
    <PageSkeleton>
      <div className="flex flex-col gap-space-md">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-[1.25rem]" />
        ))}
      </div>
    </PageSkeleton>
  );
}
