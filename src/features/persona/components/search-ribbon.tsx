"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { REGION_FILTERS, type RegionFilter } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function SearchRibbon() {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const [region, setRegion] = useState<RegionFilter>("all");

  return (
    <section className="mt-block-mobile space-y-space-md md:mt-block">
      <div className="grid grid-cols-1 items-center gap-space-sm lg:grid-cols-12">
        <div className="relative lg:col-span-8">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-space-md -translate-y-1/2 text-xl text-text-muted"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-outline-variant bg-surface-low py-3 pr-space-md pl-11 font-body-md text-body-md text-on-surface shadow-lift-sm transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>

        <div className="flex items-center justify-start gap-space-xs lg:col-span-4 lg:justify-end">
          <button
            type="button"
            className={cn(
              "flex min-h-11 items-center gap-space-xs rounded-full border border-outline-variant bg-surface-low px-space-md font-label-lg text-label-lg font-medium text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              EASE,
            )}
          >
            <Icon name="tune" className="text-base" />
            <span>{t("refineCriteria")}</span>
          </button>
          <button
            type="button"
            onClick={() => setRegion("all")}
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
            onClick={() => setRegion(key)}
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

        <button
          type="button"
          className={cn(
            "flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-outline-variant bg-surface-low px-space-md py-2 font-label-lg text-label-lg whitespace-nowrap text-on-surface-variant transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
            EASE,
          )}
        >
          <span>{tCommon("languages")}</span>
          <Icon name="keyboard_arrow_down" className="text-base" />
        </button>
        <button
          type="button"
          className={cn(
            "flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-outline-variant bg-surface-low px-space-md py-2 font-label-lg text-label-lg whitespace-nowrap text-on-surface-variant transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
            EASE,
          )}
        >
          <span>{tCommon("interests")}</span>
          <Icon name="keyboard_arrow_down" className="text-base" />
        </button>
      </div>
    </section>
  );
}
