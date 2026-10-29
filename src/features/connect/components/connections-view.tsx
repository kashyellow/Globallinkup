"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { countryLabel } from "@/lib/persona/countries";
import { cn } from "@/lib/utils";
import { RegionFilter } from "@/features/persona/components/region-filter";
import { CONNECTION_TABS, type ConnectionTab } from "../data";
import type { ConnectionsData } from "../queries";
import { ActiveConnectionsPanel } from "./active-connections-panel";
import { ReceivedRequestsPanel } from "./received-requests-panel";
import { SentRequestsPanel } from "./sent-requests-panel";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ConnectionsView({ data }: { data: ConnectionsData }) {
  const t = useTranslations("Connections");
  const locale = useLocale();
  const [tab, setTab] = useState<ConnectionTab>("active");
  const [countries, setCountries] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const availableCountries = [...new Set(data.active.map((connection) => connection.countryCode))]
    .filter(Boolean)
    .sort((a, b) => countryLabel(a, locale).localeCompare(countryLabel(b, locale), locale));

  const visibleActive = data.active.filter((connection) => {
    if (countries.length > 0 && !countries.includes(connection.countryCode)) return false;
    if (!needle) return true;
    return (
      connection.name.toLowerCase().includes(needle) ||
      connection.location.toLowerCase().includes(needle) ||
      connection.neighborhood.toLowerCase().includes(needle)
    );
  });

  const tabCounts: Record<ConnectionTab, number | null> = {
    active: data.active.length,
    requests: data.received.length,
    sent: data.sent.length,
  };

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      {/* Editorial header */}
      <header className="flex max-w-2xl flex-col gap-space-xs">
        <h1 className="font-title text-title-mobile font-bold text-balance text-on-surface md:text-title">
          {t("header.title")}
        </h1>
        <p className="max-w-[58ch] font-body-sm text-body-sm text-pretty text-on-surface-variant md:font-body-md md:text-body-md">
          {t("header.intro")}
        </p>
      </header>

      {/*
       * Underline tabs on one rule. On a phone the row scrolls sideways inside
       * itself (bleeding to the screen edges) rather than stacking three rows.
       */}
      <div className="mt-space-lg flex items-end justify-between gap-space-md border-b border-outline-variant md:mt-space-xl">
        <div className="-mx-margin-mobile no-scrollbar flex overflow-x-auto px-margin-mobile md:mx-0 md:px-0">
          {CONNECTION_TABS.map((key) => {
            const active = tab === key;
            const pending = key === "requests" && (tabCounts[key] ?? 0) > 0;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                aria-pressed={active}
                className={cn(
                  "relative -mb-px flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-3 font-label-lg text-label-lg whitespace-nowrap first:pl-0",
                  "transition-colors duration-200 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
                  EASE,
                  active
                    ? "border-primary font-semibold text-on-surface"
                    : "border-transparent text-secondary hover:text-on-surface",
                )}
              >
                <span>{t(`tabs.${key}`)}</span>
                {tabCounts[key] !== null ? (
                  <span
                    className={cn(
                      "min-w-5 rounded-full px-1.5 py-0.5 text-center font-label-md text-label-md font-semibold tabular-nums",
                      pending
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-secondary",
                    )}
                  >
                    {tabCounts[key]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-space-xs pb-3 font-label-md text-label-md text-on-surface-variant xl:flex">
          <Icon name="verified_user" className="text-base text-tertiary" />
          <span>{t("privacyChip")}</span>
        </div>
      </div>

      {/* Search + country filter narrow the active list only, so they live with it. */}
      {tab === "active" ? (
        <div className="mt-space-md flex items-center gap-space-sm">
          <div className="relative min-w-0 flex-1 md:max-w-lg">
            <Icon
              name="search"
              className="absolute top-1/2 left-space-md -translate-y-1/2 text-lg text-secondary"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("search.placeholder")}
              aria-label={t("search.placeholder")}
              className="h-12 w-full rounded-full border border-outline-variant bg-surface-low pr-space-md pl-11 font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <div className="flex shrink-0 items-center gap-space-xs">
            <RegionFilter
              selected={countries}
              onChange={setCountries}
              options={availableCountries}
            />
            {countries.length > 0 ? (
              <button
                type="button"
                onClick={() => setCountries([])}
                className="min-h-12 shrink-0 rounded-full border border-outline-variant bg-surface-low px-space-md font-label-lg text-label-lg text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                {t("regionFilters.all")}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Panels */}
      <div className="mt-space-lg md:mt-space-xl">
        {tab === "active" ? (
          <ActiveConnectionsPanel
            connections={visibleActive}
            requestCount={data.received.length}
            onReviewInquiries={() => setTab("requests")}
          />
        ) : null}
        {tab === "requests" ? <ReceivedRequestsPanel requests={data.received} /> : null}
        {tab === "sent" ? <SentRequestsPanel requests={data.sent} /> : null}
      </div>
    </div>
  );
}
