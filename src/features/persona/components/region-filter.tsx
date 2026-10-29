"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { countryLabel, ISO_COUNTRY_CODES } from "@/lib/persona/countries";
import { cn } from "@/lib/utils";

/**
 * Searchable multi-select region filter. An empty selection means "all
 * regions"; country codes mirror the persona form so the two lists cannot
 * drift. The popover stays open while toggling so several countries can be
 * checked in one pass.
 */
export function RegionFilter({
  selected,
  onChange,
  options: optionCodes,
}: {
  selected: string[];
  onChange: (countries: string[]) => void;
  /** Omit to show every platform country. Connections narrows this list. */
  options?: readonly string[];
}) {
  const t = useTranslations("Discover");
  const locale = useLocale();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const needle = query.trim().toLowerCase();
  const countries = optionCodes ?? ISO_COUNTRY_CODES;
  const options = countries
    .filter((code) => !needle || countryLabel(code, locale).toLowerCase().includes(needle))
    .sort((a, b) => countryLabel(a, locale).localeCompare(countryLabel(b, locale), locale));

  function toggle(code: string) {
    onChange(
      selected.includes(code) ? selected.filter((value) => value !== code) : [...selected, code],
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-full border px-3 font-label-lg text-label-lg transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:px-space-md",
          selected.length > 0
            ? "border-primary/40 bg-admin-surface text-on-surface"
            : "border-outline-variant bg-surface-low text-on-surface-variant hover:border-outline-hover hover:bg-surface-container",
        )}
      >
        <Icon name="tune" className="text-lg text-primary" />
        {/* Icon-only on phones so search keeps the row; the label stays for screen readers. */}
        <span className="sr-only sm:not-sr-only">{t("regionsButton")}</span>
        {selected.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 font-label-caps text-label-caps font-semibold text-on-primary tabular-nums">
            {selected.length}
          </span>
        ) : null}
        <Icon
          name="expand_more"
          className={cn(
            "text-lg text-secondary transition-transform max-sm:hidden!",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label={t("filterRegions")}
          className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-outline-variant bg-surface-low p-2 shadow-lift-lg"
        >
          <div className="relative">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base text-secondary"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("regionSearchPlaceholder")}
              aria-label={t("regionSearchPlaceholder")}
              className="h-10 w-full rounded-full border border-outline-variant bg-surface-dim pr-3 pl-9 font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => onChange([])}
            className={cn(
              "mt-2 flex min-h-10 w-full items-center justify-between rounded-xl px-3 font-label-md text-label-md transition-colors",
              selected.length === 0
                ? "bg-surface-container-high font-semibold text-on-surface"
                : "text-secondary hover:bg-surface-container hover:text-on-surface",
            )}
          >
            <span>{t("allRegions")}</span>
            {selected.length === 0 ? (
              <Icon name="check" className="text-base text-primary" />
            ) : null}
          </button>

          <ul
            role="listbox"
            aria-multiselectable="true"
            aria-label={t("filterRegions")}
            className="mt-1 max-h-72 overflow-y-auto"
          >
            {options.map((code) => {
              const active = selected.includes(code);
              return (
                <li key={code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => toggle(code)}
                    className={cn(
                      "flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 font-label-md text-label-md transition-colors",
                      active
                        ? "bg-admin-surface font-semibold text-on-surface"
                        : "text-secondary hover:bg-surface-container hover:text-on-surface",
                    )}
                  >
                    <span>{countryLabel(code, locale)}</span>
                    <Icon
                      name={active ? "check_circle" : "circle"}
                      className={cn("text-base", active ? "text-primary" : "text-outline-variant")}
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          {options.length === 0 ? (
            <p className="px-3 py-4 text-center font-body-sm text-body-sm text-secondary">
              {t("noRegionResults")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
