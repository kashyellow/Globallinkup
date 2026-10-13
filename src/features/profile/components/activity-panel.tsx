"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";
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
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const TABS = ["dispatches", "saved", "circles", "security"] as const;
type TabId = (typeof TABS)[number];

const SECURITY_ICONS: Record<SecurityEventType, string> = {
  unveiled: "lock_open",
  revoked: "lock",
  declined: "do_not_disturb_on",
  ruleChanged: "tune",
};

/** Sub-heading inside a tab panel (h3 under the section's h2). */
function PanelHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="max-w-[62ch] font-body-sm text-body-sm text-text-muted">{body}</p>
    </div>
  );
}

/** Ledger row: hairline-separated, square, one hover step. */
const LEDGER_ROW =
  "flex items-center gap-space-sm px-space-sm py-2 transition-colors duration-300 hover:bg-surface-low";

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

  /** Resolved once so the tab rail stays a pure presentational component. */
  const tabLabels = TABS.map((id) => {
    const count = counts[id];
    return count === null ? t(`tabs.${id}`) : t(`tabs.${id}`, { count });
  });

  return (
    <section>
      <SectionHead index="05" title={t("sections.archive")}>
        <span className="border border-success-border px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] text-success-text uppercase">
          {t("dispatches.visibility")}
        </span>
      </SectionHead>

      <TabBar tab={tab} onChange={setTab} labels={tabLabels} />

      <div className="mt-space-md">
        {tab === "dispatches" ? (
          <div className="space-y-space-md">
            <PanelHeading title={t("dispatches.title")} body={t("dispatches.body")} />

            <div className="divide-y divide-outline-variant border-t border-outline-variant">
              {DISPATCHES.map((dispatch, index) => (
                <DispatchCard key={dispatch.id} dispatch={dispatch} index={index} />
              ))}
            </div>

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
                    "inline-flex min-h-11 items-center gap-2 rounded-md border border-outline-variant px-6 py-2.5 font-label-lg text-label-lg text-on-surface",
                    "transition-[background-color,border-color,transform] duration-300 hover:border-outline-hover hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:scale-[0.98]",
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

            <div className="divide-y divide-outline-variant border-y border-outline-variant">
              {SAVED_GOODS.map((product) => (
                <div key={product.id} className={LEDGER_ROW}>
                  <div className="h-14 w-14 shrink-0 overflow-hidden border border-outline-variant bg-surface-low">
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
                  "inline-flex min-h-11 items-center gap-2 rounded-md border border-outline-variant px-6 py-2.5 font-label-lg text-label-lg text-on-surface",
                  "transition-[background-color,border-color,transform] duration-300 hover:border-outline-hover hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:scale-[0.98]",
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

            <div className="divide-y divide-outline-variant border-y border-outline-variant">
              {CIRCLE_MEMBERS.map((member) => (
                <div key={member.id} className={cn(LEDGER_ROW, "justify-between")}>
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-highest font-label-md font-bold text-on-surface">
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
                      "flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] uppercase",
                      member.unveiled
                        ? "border-success-border text-success-text"
                        : "border-outline-variant text-text-muted",
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

            <div className="divide-y divide-outline-variant border-y border-outline-variant">
              {SECURITY_LOG.map((event) => (
                <div key={event.id} className={cn(LEDGER_ROW, "justify-between")}>
                  <div className="flex min-w-0 items-center gap-space-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-container-highest text-text-muted">
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
    </section>
  );
}

/**
 * Index tab rail: caps micro-type on a full-width rule, with an underline that
 * slides to the active tab. The indicator is positioned imperatively (width +
 * transform only) so nothing re-renders on measurement, and the first
 * placement is flushed without a transition so it never sweeps in on mount.
 */
function TabBar({
  tab,
  onChange,
  labels,
}: {
  tab: TabId;
  onChange: (tab: TabId) => void;
  labels: readonly string[];
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const indicator = indicatorRef.current;
    if (!list || !indicator) return;

    let cancelled = false;

    const place = (animate: boolean) => {
      const active = list.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) return;
      if (!animate) indicator.style.transition = "none";
      const listRect = list.getBoundingClientRect();
      const rect = active.getBoundingClientRect();
      indicator.style.width = `${rect.width}px`;
      indicator.style.transform = `translateX(${rect.left - listRect.left}px)`;
      if (!animate) {
        void indicator.offsetWidth; // flush the instant placement
        indicator.style.transition = "";
      }
    };

    const first = indicator.dataset.moved !== "true";
    place(!first);
    if (first) indicator.dataset.moved = "true";

    const onResize = () => place(true);
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(() => {
      if (!cancelled) place(true);
    });

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
    };
  }, [tab]);

  return (
    <div className="-mx-margin-mobile no-scrollbar overflow-x-auto border-b border-outline-variant px-margin-mobile md:mx-0 md:px-0">
      <div ref={listRef} className="relative flex w-max items-end gap-space-md">
        <span
          ref={indicatorRef}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -bottom-px left-0 h-0.5 bg-primary",
            "transition-[transform,width] duration-[450ms] motion-reduce:transition-none",
            EASE,
          )}
        />
        {TABS.map((id, index) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              data-active={active}
              aria-pressed={active}
              onClick={() => onChange(id)}
              className={cn(
                "relative min-h-11 px-1 pb-2 font-label-md text-label-md tracking-[0.08em] whitespace-nowrap uppercase",
                "transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
                active ? "font-bold text-primary" : "text-text-muted hover:text-on-surface",
              )}
            >
              {labels[index]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
