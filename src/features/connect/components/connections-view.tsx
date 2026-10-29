"use client";

import type { CSSProperties } from "react";
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

/** Shared styling for the two header stat chips. */
function StatChip({
  value,
  label,
  accent,
  pulse,
}: {
  value: number;
  label: string;
  accent?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-space-xs rounded-full border px-space-md py-2 whitespace-nowrap",
        accent
          ? "border-primary-container/40 bg-primary-container/10"
          : "border-outline-variant bg-surface-container",
      )}
    >
      {pulse ? (
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary-container" />
      ) : null}
      <span
        className={cn(
          "font-headline-sm text-headline-sm font-bold tabular-nums",
          accent ? "text-primary" : "text-on-surface",
        )}
      >
        {value}
      </span>
      <span className="font-label-md text-label-md text-secondary">{label}</span>
    </div>
  );
}

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
      connection.neighborhood.toLowerCase().includes(needle) ||
      connection.interests.some((interest) => interest.toLowerCase().includes(needle))
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
      <header className="flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
        <div className="flex max-w-2xl flex-col gap-space-sm">
          <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
            {t("header.eyebrow")}
          </p>
          <h1 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {t("header.title")}
          </h1>
          <p className="max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("header.intro")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <StatChip value={data.active.length} label={t("header.activeConnections")} />
          <StatChip value={data.received.length} label={t("header.pendingRequests")} accent pulse />
        </div>
      </header>

      {/* Tab + filter bar */}
      <section className="mt-block-mobile bezel-tray md:mt-block">
        <div
          className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg"
          style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
        >
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="flex w-full flex-wrap items-center gap-2 md:w-auto">
              {CONNECTION_TABS.map((key) => {
                const active = tab === key;
                const pending = key === "requests";
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    aria-pressed={active}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 py-2 font-label-lg text-label-lg whitespace-nowrap",
                      "transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                      EASE,
                      active
                        ? "bg-primary font-semibold text-on-primary"
                        : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:bg-surface-variant hover:text-on-surface",
                    )}
                  >
                    <span>{t(`tabs.${key}`)}</span>
                    {tabCounts[key] !== null ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-label-md text-label-md font-semibold tabular-nums",
                          active
                            ? "bg-on-primary/20 text-on-primary"
                            : pending
                              ? "bg-primary-container text-on-primary"
                              : "bg-surface-container-highest text-secondary",
                        )}
                      >
                        {tabCounts[key]}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="hidden items-center gap-space-xs font-label-md text-label-md text-secondary xl:flex">
              <Icon name="verified_user" className="text-base text-tertiary" />
              <span>{t("privacyChip")}</span>
            </div>
          </div>

          {/* Search + country filter */}
          <div className="flex flex-col items-stretch justify-between gap-space-md md:flex-row md:items-center">
            <div className="relative max-w-lg flex-1">
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
                className="h-11 w-full rounded-full border border-outline-variant bg-surface-container pr-space-md pl-11 font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </div>

            <div className="flex items-center gap-space-xs">
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
        </div>
      </section>

      {/* Panels */}
      <div className="mt-space-xl">
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
