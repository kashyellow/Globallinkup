"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { REGION_FILTERS, type RegionFilter } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Controlled discovery filters (FR-4.2). Filtering happens in DiscoverWorkspace. */
export function SearchRibbon({
  query,
  onQueryChange,
  region,
  onRegionChange,
  onClear,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  region: RegionFilter;
  onRegionChange: (value: RegionFilter) => void;
  onClear: () => void;
}) {
  const t = useTranslations("Discover");

  return (
    <section className="mt-block-mobile space-y-space-md md:mt-block">
      <div className="grid grid-cols-1 items-center gap-space-sm lg:grid-cols-12">
        <div className="relative lg:col-span-8">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-space-md -translate-y-1/2 text-xl text-text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            className="w-full rounded-full border border-outline-variant bg-surface-low py-3 pr-space-md pl-11 font-body-md text-body-md text-on-surface shadow-lift-sm transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex items-center justify-start gap-space-xs lg:col-span-4 lg:justify-end">
          <button
            type="button"
            onClick={onClear}
            className={cn(
              "min-h-11 rounded-full border border-outline-variant bg-surface-low px-space-md font-label-lg text-label-lg text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              EASE,
            )}
          >
            {t("clearFilters")}
          </button>
        </div>
      </div>

      <div className="-mx-margin-mobile no-scrollbar flex items-center gap-space-xs overflow-x-auto px-margin-mobile md:mx-0 md:px-0">
        {REGION_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onRegionChange(key)}
            aria-pressed={region === key}
            className={cn(
              "min-h-11 shrink-0 rounded-full px-space-md py-2 font-label-lg text-label-lg whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              EASE,
              region === key
                ? "bg-primary font-semibold text-on-primary"
                : "border border-outline-variant bg-surface-low text-on-surface-variant hover:border-outline-hover hover:bg-surface-container hover:text-on-surface",
            )}
          >
            {key === "all" ? t("allRegions") : t(`regions.${key}`)}
          </button>
        ))}
      </div>
    </section>
  );
}

export type { RegionFilter };
export { REGION_FILTERS };
