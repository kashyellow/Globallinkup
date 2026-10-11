"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ADMIN_METRICS, ADMIN_TAB_COUNTS, ADMIN_TABS, type AdminTab } from "../data";
import { AdminMarketplaceTab } from "./marketplace-tab";
import { AdminModerationTab } from "./moderation-tab";
import { AdminUsersTab } from "./users-tab";

const TAB_ICONS: Record<AdminTab, string> = {
  users: "how_to_reg",
  marketplace: "storefront",
  moderation: "gavel",
};

const METRIC_KEYS = [
  { key: "pendingProfiles", count: ADMIN_METRICS.pendingProfiles, dot: "bg-primary" },
  { key: "reportedPosts", count: ADMIN_METRICS.reportedPosts, dot: "bg-danger" },
  { key: "curatedProducts", count: ADMIN_METRICS.curatedProducts, dot: "bg-success-bright" },
  { key: "openReports", count: ADMIN_METRICS.openReports, dot: "bg-secondary" },
] as const;

export function AdminView() {
  const t = useTranslations("Admin");
  const [tab, setTab] = useState<AdminTab>("users");

  return (
    <>
      {/* Administrative context sub-bar */}
      <section className="w-full border-b border-outline-variant bg-surface">
        <div className="mx-auto flex max-w-[1240px] flex-col justify-between gap-space-md px-margin-mobile py-space-md lg:flex-row lg:items-center lg:px-margin">
          <div className="flex flex-col gap-space-sm sm:flex-row sm:items-center sm:gap-space-md">
            <div className="flex items-center gap-space-xs font-label-md text-label-md text-secondary">
              <Icon name="shield_person" className="shrink-0 text-base" />
              <span className="whitespace-nowrap">{t("portal")}</span>
              <span className="text-outline-variant">/</span>
              <span className="font-medium whitespace-nowrap text-on-surface">
                {t("panelTitle")}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-admin-border bg-admin-surface px-space-sm py-1 font-label-md text-label-md font-semibold text-admin-text">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t("roleBadge")}
            </span>
          </div>

          <div className="no-scrollbar flex items-center gap-space-xs overflow-x-auto pb-0.5 lg:flex-wrap lg:gap-space-sm lg:overflow-visible lg:pb-0">
            {METRIC_KEYS.map((metric) => (
              <div
                key={metric.key}
                className="flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-space-sm py-1 font-label-md text-label-md text-secondary"
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", metric.dot)} />
                <span>
                  {t.rich(`metrics.${metric.key}`, {
                    count: metric.count,
                    b: (chunks) => (
                      <strong className="font-semibold text-on-surface tabular-nums">
                        {chunks}
                      </strong>
                    ),
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workstation */}
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-space-lg px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="flex flex-col gap-space-md border-b border-outline-variant pb-space-md xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="mb-2 font-label-md text-label-md font-semibold text-primary">
              {t("eyebrow")}
            </p>
            <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
              {t("title")}
            </h1>
          </div>

          <div className="-mx-margin-mobile no-scrollbar flex items-center gap-space-xs overflow-x-auto px-margin-mobile pb-1 md:mx-0 md:px-0 xl:overflow-visible xl:pb-0">
            {ADMIN_TABS.map((key) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  aria-pressed={active}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full px-space-md py-2.5 font-label-md text-label-md transition-colors duration-300",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                    active
                      ? "bg-surface-container-high font-semibold text-on-surface"
                      : "text-secondary hover:bg-surface-container hover:text-on-surface",
                  )}
                >
                  <Icon name={TAB_ICONS[key]} className={cn("text-lg", active && "text-primary")} />
                  <span>{t(`tabs.${key}`)}</span>
                  <span
                    className={cn(
                      "rounded-full border px-1.5 py-0.5 font-label-md text-label-md font-semibold tabular-nums",
                      key === "moderation"
                        ? "border-danger-border bg-danger-surface text-danger-text"
                        : active
                          ? "border-admin-border bg-admin-surface text-admin-text"
                          : "border-outline-variant bg-surface-container text-secondary",
                    )}
                  >
                    {ADMIN_TAB_COUNTS[key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {tab === "users" ? <AdminUsersTab /> : null}
        {tab === "marketplace" ? <AdminMarketplaceTab /> : null}
        {tab === "moderation" ? <AdminModerationTab /> : null}
      </div>
    </>
  );
}
