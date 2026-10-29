"use client";

import type { ReactNode } from "react";

import { usePathname } from "@/lib/i18n/navigation";

/**
 * Reserves room for the fixed mobile tab bar only where that bar exists.
 * Admin has its own tab rail, so the member bar is hidden there and the
 * footer can sit flush with the page end.
 */
export function AppFooterSpace({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <div className={isAdmin ? undefined : "pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"}>
      {children}
    </div>
  );
}
