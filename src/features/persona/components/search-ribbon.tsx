"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { REGION_FILTERS, type RegionFilter } from "../data";

export function SearchRibbon() {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const [region, setRegion] = useState<RegionFilter>("all");

  return (
    <section className="mt-space-sm mb-space-lg space-y-space-md">
      <div className="grid grid-cols-1 items-center gap-space-sm lg:grid-cols-12">
        <div className="relative lg:col-span-8">
          <Icon
            name="search"
            className="absolute top-1/2 left-space-md -translate-y-1/2 text-xl text-text-muted"
          />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pr-space-md pl-11 font-body-md text-body-md text-on-surface shadow-sm placeholder:text-text-muted focus:ring-2 focus:ring-primary-container/30 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-start gap-space-xs lg:col-span-4 lg:justify-end">
          <button
            type="button"
            className="flex items-center gap-space-xs rounded-xl border border-outline-variant bg-surface-low px-space-md py-3 font-label-md text-label-md text-on-surface-strong shadow-sm transition-colors hover:border-outline hover:bg-surface-container"
          >
            <Icon name="tune" className="text-base" />
            <span>{t("refineCriteria")}</span>
          </button>
          <button
            type="button"
            onClick={() => setRegion("all")}
            className="rounded-xl border border-outline-variant bg-surface-low px-space-md py-3 font-label-md text-label-md text-secondary shadow-sm transition-colors hover:bg-surface-container hover:text-on-surface"
          >
            {t("clearFilters")}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-space-xs">
        {REGION_FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setRegion(key)}
            className={cn(
              "min-h-9 rounded-xl px-space-md py-1.5 font-label-md text-label-md shadow-sm transition-colors",
              region === key
                ? "bg-primary-container font-medium text-white"
                : "border border-outline-variant bg-surface-low text-on-surface-variant hover:border-outline hover:bg-surface-container hover:text-on-surface",
            )}
          >
            {key === "all" ? t("allRegions") : t(`regions.${key}`)}
          </button>
        ))}

        <button
          type="button"
          className="flex min-h-9 items-center gap-1 rounded-xl border border-outline-variant bg-surface-low px-space-md py-1.5 font-label-md text-label-md text-on-surface-variant shadow-sm transition-colors hover:border-outline hover:bg-surface-container hover:text-on-surface"
        >
          <span>{tCommon("languages")}</span>
          <Icon name="keyboard_arrow_down" className="text-xs" />
        </button>
        <button
          type="button"
          className="flex min-h-9 items-center gap-1 rounded-xl border border-outline-variant bg-surface-low px-space-md py-1.5 font-label-md text-label-md text-on-surface-variant shadow-sm transition-colors hover:border-outline hover:bg-surface-container hover:text-on-surface"
        >
          <span>{tCommon("interests")}</span>
          <Icon name="keyboard_arrow_down" className="text-xs" />
        </button>
      </div>
    </section>
  );
}
