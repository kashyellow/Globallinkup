"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  CIRCLE_MEMBERS,
  DEMO_NOW_DATE,
  DISPATCHES,
  PROFILE_TOTALS,
  SAVED_GOODS,
  SECURITY_LOG,
  daysAgoDate,
  type SecurityEventType,
} from "../data";
import { DispatchCard } from "./dispatch-card";

const TABS = ["dispatches", "saved", "circles", "security"] as const;
type TabId = (typeof TABS)[number];

const SECURITY_ICONS: Record<SecurityEventType, string> = {
  unveiled: "lock_open",
  revoked: "lock",
  declined: "do_not_disturb_on",
  ruleChanged: "tune",
};

function PanelHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="px-1">
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="font-body-sm text-body-sm text-text-muted">{body}</p>
    </div>
  );
}

export function ProfileActivity() {
  const t = useTranslations("Profile");
  const format = useFormatter();
  const [tab, setTab] = useState<TabId>("dispatches");
  const [archiveEnded, setArchiveEnded] = useState(false);

  const relative = (daysAgo: number) => format.relativeTime(daysAgoDate(daysAgo), DEMO_NOW_DATE);

  const counts: Record<TabId, number | null> = {
    dispatches: PROFILE_TOTALS.dispatches,
    saved: PROFILE_TOTALS.saved,
    circles: PROFILE_TOTALS.circles,
    security: null,
  };

  return (
    <div className="space-y-space-lg">
      {/*
        `justify-between` spreads the tabs across the full-width track so shorter labels (e.g.
        Spanish) don't leave dead space at the right. When the labels overflow the track on
        narrow screens, flexbox falls back to flex-start and the row scrolls instead.
      */}
      <div className="no-scrollbar flex items-center justify-between gap-1 overflow-x-auto rounded-2xl bg-surface-container p-1">
        {TABS.map((id) => {
          const active = tab === id;
          const count = counts[id];
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => setTab(id)}
              className={cn(
                "min-h-10 shrink-0 rounded-xl px-3 py-2 font-label-md text-label-md transition-colors",
                active
                  ? "bg-surface-container-highest font-semibold text-on-surface shadow-sm"
                  : "hover:bg-surface-container-low text-text-muted hover:text-on-surface",
              )}
            >
              {count === null ? t(`tabs.${id}`) : t(`tabs.${id}`, { count })}
            </button>
          );
        })}
      </div>

      {tab === "dispatches" ? (
        <div className="space-y-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm px-1">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("dispatches.title")}
              </h3>
              <p className="font-body-sm text-body-sm text-text-muted">{t("dispatches.body")}</p>
            </div>
            <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
              {t("dispatches.visibility")}
            </span>
          </div>

          {DISPATCHES.map((dispatch) => (
            <DispatchCard key={dispatch.id} dispatch={dispatch} />
          ))}

          <div className="flex items-center justify-center pt-space-md">
            {archiveEnded ? (
              <p className="font-body-sm text-body-sm text-text-muted">
                {t("dispatches.archiveEnd")}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setArchiveEnded(true)}
                className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-container px-6 py-2.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-container-high"
              >
                <span>{t("dispatches.loadEarlier")}</span>
                <Icon name="expand_more" className="text-[18px]" />
              </button>
            )}
          </div>
        </div>
      ) : null}

      {tab === "saved" ? (
        <div className="space-y-space-md">
          <PanelHeading title={t("saved.title")} body={t("saved.body")} />

          <div className="space-y-space-xs">
            {SAVED_GOODS.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-space-md rounded-2xl bg-surface-container p-space-sm transition-colors hover:bg-surface-container-high"
              >
                <div className="bg-surface-container-low h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={product.imageAlt}
                    src={product.image}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">
                    {product.name}
                  </span>
                  <span className="font-label-caps text-label-caps text-text-muted uppercase">
                    {product.originLabel}
                  </span>
                </div>
                <span className="shrink-0 font-label-lg text-label-lg font-semibold text-on-surface">
                  {format.number(product.price, "currency")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-space-sm">
            <Link
              href="/marketplace"
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-surface-container px-6 py-2.5 font-label-md text-label-md text-on-surface transition-all hover:bg-surface-container-high"
            >
              <span>{t("saved.browse")}</span>
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>
        </div>
      ) : null}

      {tab === "circles" ? (
        <div className="space-y-space-md">
          <PanelHeading title={t("circles.title")} body={t("circles.body")} />

          <div className="space-y-space-xs">
            {CIRCLE_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-space-sm rounded-2xl bg-surface-container p-space-sm"
              >
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-label-md font-bold text-on-surface">
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">
                      {member.name}
                    </span>
                    <span className="font-label-caps text-label-caps text-text-muted">
                      {member.city}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 font-label-caps text-[10px] font-bold tracking-wider uppercase",
                    member.unveiled
                      ? "bg-tertiary/10 text-tertiary"
                      : "bg-surface-container-highest text-text-muted",
                  )}
                >
                  <Icon name={member.unveiled ? "lock_open" : "lock"} className="text-[13px]" />
                  {member.unveiled ? t("circles.unveiled") : t("circles.awaiting")}
                </span>
              </div>
            ))}
          </div>

          <p className="px-1 font-body-sm text-body-sm text-text-muted">
            {t("circles.more", { count: PROFILE_TOTALS.circles - CIRCLE_MEMBERS.length })}
          </p>
        </div>
      ) : null}

      {tab === "security" ? (
        <div className="space-y-space-md">
          <PanelHeading title={t("security.title")} body={t("security.body")} />

          <div className="space-y-space-xs">
            {SECURITY_LOG.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between gap-space-sm rounded-2xl bg-surface-container p-space-sm"
              >
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-text-muted">
                    <Icon name={SECURITY_ICONS[event.type]} className="text-[18px]" />
                  </div>
                  <span className="min-w-0 font-label-md text-label-md text-on-surface">
                    {t(`security.events.${event.type}`, { name: event.name ?? "" })}
                  </span>
                </div>
                <span className="shrink-0 font-label-caps text-label-caps text-text-muted">
                  {relative(event.daysAgo)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
