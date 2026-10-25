"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import { RegionFilter } from "./region-filter";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Controlled discovery toolbar. The query/region state and the server fetch
 * live in DiscoverWorkspace; this component only renders the controls.
 */
export function SearchRibbon({
  query,
  onQueryChange,
  countries,
  onCountriesChange,
  onClear,
  loading,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  countries: string[];
  onCountriesChange: (countries: string[]) => void;
  onClear: () => void;
  loading: boolean;
}) {
  const t = useTranslations("Discover");
  const hasFilters = query.trim().length > 0 || countries.length > 0;

  return (
    <section className="mt-block-mobile space-y-space-md md:mt-block">
      <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          {loading ? (
            <span className="pointer-events-none absolute top-1/2 left-space-md -translate-y-1/2">
              <Spinner className="text-primary" label={t("searching")} />
            </span>
          ) : (
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-space-md -translate-y-1/2 text-xl text-text-muted"
            />
          )}
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            aria-busy={loading || undefined}
            className="w-full rounded-full border border-outline-variant bg-surface-low py-3 pr-space-md pl-11 font-body-md text-body-md text-on-surface shadow-lift-sm transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex items-center gap-space-xs">
          <div className="min-w-0 flex-1 sm:flex-none">
            <RegionFilter selected={countries} onChange={onCountriesChange} />
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                "min-h-12 shrink-0 rounded-full border border-outline-variant bg-surface-low px-space-md font-label-lg text-label-lg text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
              )}
            >
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
