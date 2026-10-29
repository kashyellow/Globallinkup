"use client";

import { Icon } from "@/components/ui/icon";
import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * One compact button instead of two: clicking advances to the next locale
 * (EN → ES → EN), mirroring the theme control. The header keeps a single
 * affordance at every breakpoint instead of a second row in the burger menu.
 */
export function LocaleSwitch({
  locale,
  onSwitch,
  disabled = false,
  label,
}: {
  locale: string;
  onSwitch: (next: Locale) => void;
  disabled?: boolean;
  label: string;
}) {
  const current = routing.locales.includes(locale as Locale)
    ? (locale as Locale)
    : routing.locales[0];
  const next = routing.locales[(routing.locales.indexOf(current) + 1) % routing.locales.length];

  return (
    <button
      type="button"
      onClick={() => onSwitch(next)}
      disabled={disabled}
      aria-busy={disabled || undefined}
      aria-label={`${label}: ${next.toUpperCase()}`}
      title={`${label}: ${next.toUpperCase()}`}
      className={cn(
        "flex h-11 items-center justify-center gap-1 rounded-full px-2.5 text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
      )}
    >
      <Icon name="translate" className="text-[18px]" />
      <span className="font-label-md text-label-md font-semibold">{current.toUpperCase()}</span>
    </button>
  );
}
