"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { CONNECTION_TABS, REGION_FILTERS, type ConnectionTab, type RegionFilter } from "../data";
import type { ConnectionsData } from "../queries";
import { ActiveConnectionsPanel } from "./active-connections-panel";
import { ReceivedRequestsPanel } from "./received-requests-panel";
import { ArchivedPanel, SentRequestsPanel } from "./sent-requests-panel";

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
  const [tab, setTab] = useState<ConnectionTab>("active");
  const [region, setRegion] = useState<RegionFilter>("all");

  const tabCounts: Record<ConnectionTab, number | null> = {
    active: data.active.length,
    requests: data.received.length,
    sent: data.sent.length,
    archived: null,
  };

  const LATAM = new Set(["MX", "CO", "AR", "CL", "PE", "CR", "UY", "EC"]);
  const EUROPE = new Set(["ES", "PT", "FR", "IT", "DE"]);
  const regionCounts: Record<RegionFilter, number | null> = {
    all: null,
    latam: data.active.filter((connection) => LATAM.has(connection.countryCode)).length,
    europe: data.active.filter((connection) => EUROPE.has(connection.countryCode)).length,
    recent: null,
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
          <button
            type="button"
            className={cn(
              "inline-flex min-h-11 items-center gap-space-xs rounded-full border border-outline-variant bg-surface-container px-space-md py-2 font-label-lg text-label-lg text-on-surface",
              "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
              "transition-colors duration-300",
              EASE,
            )}
          >
            <Icon name="badge" className="text-sm text-secondary" />
            <span>{t("header.exportVCard")}</span>
          </button>
        </div>
      </header>

      {/* Tab + filter bar */}
      <section className="mt-block-mobile bezel-tray md:mt-block">
        <div
          className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg"
          style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
        >
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="-mx-space-md no-scrollbar flex w-full items-center gap-2 overflow-x-auto px-space-md md:mx-0 md:w-auto md:px-0">
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

          {/* Search + region pills */}
          <div className="flex flex-col items-stretch justify-between gap-space-md md:flex-row md:items-center">
            <div className="relative max-w-lg flex-1">
              <Icon
                name="search"
                className="absolute top-1/2 left-space-md -translate-y-1/2 text-lg text-secondary"
              />
              <input
                type="search"
                placeholder={t("search.placeholder")}
                className="h-11 w-full rounded-full border border-outline-variant bg-surface-container pr-space-md pl-11 font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </div>

            <div className="-mx-space-md no-scrollbar flex items-center gap-space-xs overflow-x-auto px-space-md py-1 md:mx-0 md:px-0 md:py-0">
              {REGION_FILTERS.map((key) => {
                const selected = region === key;
                const count = regionCounts[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setRegion(key)}
                    aria-pressed={selected}
                    className={cn(
                      "min-h-11 shrink-0 rounded-full px-space-md py-2 font-label-md text-label-md whitespace-nowrap",
                      "transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                      EASE,
                      selected
                        ? "bg-surface-container-highest font-semibold text-on-surface"
                        : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:text-on-surface",
                    )}
                  >
                    {count === null
                      ? t(`regionFilters.${key}`)
                      : t(`regionFilters.${key}`, { count })}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Panels */}
      <div className="mt-space-xl">
        {tab === "active" ? (
          <ActiveConnectionsPanel
            connections={data.active}
            requestCount={data.received.length}
            onReviewInquiries={() => setTab("requests")}
          />
        ) : null}
        {tab === "requests" ? <ReceivedRequestsPanel requests={data.received} /> : null}
        {tab === "sent" ? <SentRequestsPanel requests={data.sent} /> : null}
        {tab === "archived" ? <ArchivedPanel /> : null}
      </div>
    </div>
  );
}
