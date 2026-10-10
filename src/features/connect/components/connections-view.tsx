"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  ACTIVE_CONNECTIONS,
  CONNECTION_TABS,
  RECEIVED_REQUESTS,
  REGION_FILTERS,
  SENT_REQUESTS,
  type ConnectionTab,
  type RegionFilter,
} from "../data";
import { ActiveConnectionsPanel } from "./active-connections-panel";
import { ReceivedRequestsPanel } from "./received-requests-panel";
import { ArchivedPanel, SentRequestsPanel } from "./sent-requests-panel";

const LATAM_COUNT = ACTIVE_CONNECTIONS.filter((c) => c.region === "latam").length;
const EUROPE_COUNT = ACTIVE_CONNECTIONS.filter((c) => c.region === "europe").length;

export function ConnectionsView() {
  const t = useTranslations("Connections");
  const [tab, setTab] = useState<ConnectionTab>("active");
  const [region, setRegion] = useState<RegionFilter>("all");

  const tabCounts: Record<ConnectionTab, number | null> = {
    active: ACTIVE_CONNECTIONS.length,
    requests: RECEIVED_REQUESTS.length,
    sent: SENT_REQUESTS.length,
    archived: null,
  };

  const regionCounts: Record<RegionFilter, number | null> = {
    all: null,
    latam: LATAM_COUNT,
    europe: EUROPE_COUNT,
    recent: null,
  };

  return (
    <>
      {/* Page header */}
      <section className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-xl pb-space-lg md:px-margin">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs">
            <span className="inline-block h-2 w-2 rounded-full bg-tertiary" />
            <span className="font-label-caps text-label-caps tracking-widest text-secondary uppercase">
              {t("header.eyebrow")}
            </span>
          </div>

          <div className="mt-space-xs flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface md:text-headline-xl">
                {t("header.title")}{" "}
                <span className="font-light text-secondary">/ {t("header.titleAlt")}</span>
              </h1>
              <p className="mt-space-xs font-body-md text-body-md text-on-surface-strong">
                {t("header.intro")}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-space-sm">
              <div className="flex items-center gap-space-xs rounded-xl border border-outline-variant bg-surface-low px-space-md py-2 shadow-sm">
                <span className="font-headline-sm text-headline-sm font-bold text-primary">
                  {ACTIVE_CONNECTIONS.length}
                </span>
                <span className="font-label-md text-label-md text-secondary">
                  {t("header.activeConnections")}
                </span>
              </div>
              <div className="flex items-center gap-space-xs rounded-xl border border-border-dark bg-secondary-container-alt px-space-md py-2 shadow-sm">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-primary-container" />
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  {RECEIVED_REQUESTS.length}
                </span>
                <span className="font-label-md text-label-md font-medium text-on-surface-strong">
                  {t("header.pendingRequests")}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-space-xs rounded-xl border border-outline-variant bg-surface-low px-space-md py-2.5 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-variant"
              >
                <Icon name="badge" className="text-sm text-secondary" />
                <span>{t("header.exportVCard")}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & tab navigation */}
      <section className="mx-auto mb-space-lg w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-md shadow-sm md:p-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-md">
            <div className="no-scrollbar flex w-full items-center gap-space-lg overflow-x-auto md:w-auto">
              {CONNECTION_TABS.map((key) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    aria-pressed={active}
                    className={cn(
                      "flex items-center gap-space-xs pb-space-sm font-label-lg text-label-lg whitespace-nowrap transition-all",
                      active
                        ? "border-b-2 border-primary-container font-semibold text-primary-container"
                        : "text-secondary hover:text-on-surface",
                    )}
                  >
                    <span>{t(`tabs.${key}`)}</span>
                    {tabCounts[key] !== null ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 font-label-caps text-label-caps",
                          key === "requests"
                            ? "bg-primary-container font-bold text-white"
                            : active
                              ? "bg-surface-variant text-on-surface"
                              : "bg-surface-variant text-secondary",
                        )}
                      >
                        {key === "requests"
                          ? t("tabs.pendingBadge", { count: tabCounts[key] })
                          : tabCounts[key]}
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
          <div className="flex flex-col items-stretch justify-between gap-space-md pt-space-xs md:flex-row md:items-center">
            <div className="relative max-w-lg flex-1">
              <Icon
                name="search"
                className="absolute top-1/2 left-space-md -translate-y-1/2 text-lg text-secondary"
              />
              <input
                type="text"
                placeholder={t("search.placeholder")}
                className="w-full rounded-lg border border-outline-variant bg-surface-container py-2 pr-space-md pl-10 font-body-sm text-body-sm text-on-surface placeholder:text-secondary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="no-scrollbar flex items-center gap-space-xs overflow-x-auto pb-1 md:pb-0">
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
                      "rounded px-space-md py-1 font-label-md text-label-md whitespace-nowrap transition-all",
                      selected
                        ? "border border-border-dark bg-secondary-container-alt font-semibold text-on-surface"
                        : "border border-outline-variant bg-surface-low text-secondary hover:text-on-surface",
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
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile md:px-margin">
        {tab === "active" ? (
          <ActiveConnectionsPanel onReviewInquiries={() => setTab("requests")} />
        ) : null}
        {tab === "requests" ? <ReceivedRequestsPanel /> : null}
        {tab === "sent" ? <SentRequestsPanel /> : null}
        {tab === "archived" ? <ArchivedPanel /> : null}
      </div>

      {/* Sovereign privacy banner */}
      <section className="mx-auto mt-space-xl mb-space-xl w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <div className="flex flex-col items-center justify-between gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm md:flex-row">
          <div className="flex items-center gap-space-md">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-tertiary/30 bg-tertiary/15 text-tertiary">
              <Icon name="shield" className="text-2xl" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("security.title")}
              </h4>
              <p className="max-w-2xl font-body-sm text-body-sm text-on-surface-strong">
                {t("security.body")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-space-sm">
            <button
              type="button"
              className="rounded-xl border border-outline-variant bg-surface-variant px-space-md py-2 font-label-md text-label-md text-on-surface transition-all hover:bg-[#2e2b27]"
            >
              {t("security.manageKeys")}
            </button>
            <button
              type="button"
              className="rounded-xl border border-outline-variant bg-surface-low px-space-md py-2 font-label-md text-label-md text-secondary transition-all hover:bg-surface-variant hover:text-on-surface"
            >
              {t("security.auditLogs")}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
