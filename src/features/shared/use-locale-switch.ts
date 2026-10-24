"use client";

import { useEffect, useRef, useTransition } from "react";
import { useLocale } from "next-intl";

import { usePathname, useRouter } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

/**
 * Locale switch with a pending state and a shared scroll position.
 *
 * Without this, `/en#hero` and `/es#hero` each keep their own scroll/history
 * position, so switching languages appears to jump to a different section.
 * We capture the current hash/Y, navigate with `scroll: false`, then restore the
 * same target after the new locale has rendered.
 */
export function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const pendingScroll = useRef<{ hash: string; y: number } | null>(null);

  useEffect(() => {
    const saved = pendingScroll.current;
    if (!saved) return;
    pendingScroll.current = null;

    const timer = window.setTimeout(() => {
      const id = saved.hash ? decodeURIComponent(saved.hash.slice(1)) : "";
      const target = id ? document.getElementById(id) : null;

      if (target) target.scrollIntoView({ block: "start" });
      else window.scrollTo({ top: saved.y, left: 0 });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [locale, pathname]);

  function switchLocale(next: Locale) {
    if (next === locale) return;

    const search = typeof window === "undefined" ? "" : window.location.search;
    const hash = typeof window === "undefined" ? "" : window.location.hash;
    const y = typeof window === "undefined" ? 0 : window.scrollY;
    pendingScroll.current = { hash, y };

    startTransition(() =>
      router.replace(`${pathname}${search}${hash}`, { locale: next, scroll: false }),
    );
  }

  return { locale, pending, switchLocale };
}
