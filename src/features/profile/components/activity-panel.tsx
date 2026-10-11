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

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

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
    <div className="space-y-1">
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
      <p className="max-w-[62ch] font-body-sm text-body-sm text-text-muted">{body}</p>
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
      <div className="-mx-margin-mobile no-scrollbar flex items-center gap-1 overflow-x-auto px-margin-mobile md:mx-0 md:px-0">
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
                "min-h-10 shrink-0 rounded-full px-4 py-2 font-label-lg text-label-lg whitespace-nowrap",
                "transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
                active
                  ? "bg-primary font-semibold text-on-primary"
                  : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              {count === null ? t(`tabs.${id}`) : t(`tabs.${id}`, { count })}
            </button>
          );
        })}
      </div>

      {tab === "dispatches" ? (
        <div className="space-y-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <PanelHeading title={t("dispatches.title")} body={t("dispatches.body")} />
            <span className="shrink-0 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
              {t("dispatches.visibility")}
            </span>
          </div>

          {DISPATCHES.map((dispatch) => (
            <DispatchCard key={dispatch.id} dispatch={dispatch} />
          ))}

          <div className="flex items-center justify-center pt-space-sm">
            {archiveEnded ? (
              <p className="font-body-sm text-body-sm text-text-muted">
                {t("dispatches.archiveEnd")}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setArchiveEnded(true)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-6 py-2.5 font-label-lg text-label-lg text-on-surface",
                  "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                  "transition-colors duration-300",
                  EASE,
                )}
              >
                <span>{t("dispatches.loadEarlier")}</span>
                <Icon name="expand_more" className="text-lg" />
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
                className="flex items-center gap-space-md rounded-2xl border border-outline-variant bg-surface-container p-space-sm transition-colors duration-300 hover:border-outline-hover"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-surface-low">
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
                  <span className="font-label-md text-label-md text-text-muted">
                    {product.originLabel}
                  </span>
                </div>
                <span className="shrink-0 font-label-lg text-label-lg font-semibold text-on-surface tabular-nums">
                  {format.number(product.price, "currency")}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-space-sm">
            <Link
              href="/marketplace"
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-6 py-2.5 font-label-lg text-label-lg text-on-surface",
                "hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                "transition-colors duration-300",
                EASE,
              )}
            >
              <span>{t("saved.browse")}</span>
              <Icon name="arrow_forward" className="text-lg" />
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
                className="flex items-center justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-sm"
              >
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-label-md font-bold text-on-surface">
                    {member.initials}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-label-md text-label-md font-semibold text-on-surface">
                      {member.name}
                    </span>
                    <span className="font-label-md text-label-md text-text-muted">
                      {member.city}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 font-label-md text-label-md font-semibold",
                    member.unveiled
                      ? "border border-success-border bg-success-surface text-success-text"
                      : "bg-surface-container-highest text-text-muted",
                  )}
                >
                  <Icon name={member.unveiled ? "lock_open" : "lock"} className="text-sm" />
                  {member.unveiled ? t("circles.unveiled") : t("circles.awaiting")}
                </span>
              </div>
            ))}
          </div>

          <p className="font-body-sm text-body-sm text-text-muted">
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
                className="flex items-center justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-sm"
              >
                <div className="flex min-w-0 items-center gap-space-sm">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container-highest text-text-muted">
                    <Icon name={SECURITY_ICONS[event.type]} className="text-lg" />
                  </div>
                  <span className="min-w-0 font-label-md text-label-md text-on-surface">
                    {t(`security.events.${event.type}`, { name: event.name ?? "" })}
                  </span>
                </div>
                <span className="shrink-0 font-label-md text-label-md text-text-muted">
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
