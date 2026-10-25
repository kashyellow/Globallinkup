"use client";

import { routing, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Shared compact locale switch used by the public and app headers. */
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
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      {routing.locales.map((code, index) => (
        <span key={code} className="flex items-center gap-1">
          {index > 0 ? (
            <span aria-hidden className="h-1 w-1 rounded-full bg-outline-strong" />
          ) : null}
          <button
            type="button"
            onClick={() => onSwitch(code)}
            disabled={disabled}
            aria-busy={disabled || undefined}
            aria-current={code === locale ? "true" : undefined}
            className={cn(
              "min-h-9 rounded-full px-1.5 font-label-md text-label-md transition-colors duration-300",
              EASE,
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60",
              code === locale
                ? "font-bold text-on-surface"
                : "font-medium text-text-muted hover:text-on-surface",
            )}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
