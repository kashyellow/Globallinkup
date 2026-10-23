"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Locale switch with a pending state. Reads the current query/hash from
 * `window` at click time so `?page=` and `#section` survive the switch.
 */
export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchLocale(next: Locale) {
    if (next === locale) return;

    const suffix =
      typeof window === "undefined" ? "" : `${window.location.search}${window.location.hash}`;

    startTransition(() => router.replace(`${pathname}${suffix}`, { locale: next }));
  }

  return { locale, pending, switchLocale };
}
