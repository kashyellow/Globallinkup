"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type MediaStatus = "loading" | "loaded" | "error";

/**
 * Image with a built-in loading shimmer and error fallback.
 *
 * `wrapperClassName` controls the frame (aspect ratio, rounding, size); the
 * wrapper must have a height because the image fills it with `h-full`.
 */
export function MediaImage({
  src,
  alt,
  wrapperClassName,
  className,
  loading = "lazy",
  fetchPriority,
  iconClassName,
}: {
  src: string | null | undefined;
  alt: string;
  wrapperClassName?: string;
  className?: string;
  loading?: "lazy" | "eager";
  fetchPriority?: "high" | "low" | "auto";
  iconClassName?: string;
}) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const status: MediaStatus = !src
    ? "error"
    : failedSrc === src
      ? "error"
      : loadedSrc === src
        ? "loaded"
        : "loading";

  return (
    <span
      role={status === "error" ? "img" : undefined}
      aria-label={status === "error" ? alt : undefined}
      className={cn("relative block overflow-hidden bg-surface-container", wrapperClassName)}
    >
      {src && status !== "error" ? (
        // Signed URLs expire; a plain <img> keeps the browser cache behaviour
        // predictable and avoids the image optimiser re-fetching a dead URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={alt}
          src={src}
          loading={loading}
          fetchPriority={fetchPriority}
          decoding="async"
          onLoad={() => {
            setLoadedSrc(src);
            setFailedSrc(null);
          }}
          onError={() => setFailedSrc(src)}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
            status === "loaded" ? "opacity-100" : "opacity-0",
            className,
          )}
        />
      ) : null}

      {status === "loading" ? (
        <span
          aria-hidden
          className="absolute inset-0 animate-pulse bg-surface-container-highest/70 [animation-delay:150ms] motion-reduce:animate-none"
        />
      ) : null}

      {status === "error" ? (
        <span className="flex h-full w-full items-center justify-center bg-surface-variant text-secondary">
          <Icon name="image" className={cn("text-2xl", iconClassName)} />
        </span>
      ) : null}
    </span>
  );
}
