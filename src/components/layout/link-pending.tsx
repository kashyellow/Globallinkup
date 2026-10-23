"use client";

import { useLinkStatus } from "next/link";

import { cn } from "@/lib/utils";

/**
 * Subtle pending overlay for a Link. Must be rendered inside a Next `<Link>`.
 * The element is always present and only toggles opacity, so it never shifts
 * the layout.
 */
export function LinkPending({ className }: { className?: string }) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-full bg-current/10 opacity-0 transition-opacity duration-200",
        pending && "opacity-100",
        className,
      )}
    />
  );
}
