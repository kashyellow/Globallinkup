"use client";

import { useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ProfileDispatch, UnveiledPeer } from "../queries";
import { DispatchCard } from "./dispatch-card";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Only tabs backed by a real table are rendered (D2, option 1). */
const TABS = ["dispatches", "circles"] as const;
type TabId = (typeof TABS)[number];

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

const EMPTY_STATE =
  "border-y border-outline-variant py-space-lg text-center font-body-sm text-body-sm text-text-muted";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileActivity({
  dispatches,
  circles,
}: {
  dispatches: ProfileDispatch[];
  circles: UnveiledPeer[];
}) {
  const t = useTranslations("Profile");
  const [tab, setTab] = useState<TabId>("dispatches");

  const counts: Record<TabId, number> = {
    dispatches: dispatches.length,
    circles: circles.length,
  };

  /** Resolved once so the tab rail stays a pure presentational component. */
  const tabLabels = TABS.map((id) => t(`tabs.${id}`, { count: counts[id] }));

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

            {dispatches.length > 0 ? (
              <div className="divide-y divide-outline-variant border-t border-outline-variant">
                {dispatches.map((dispatch, index) => (
                  <DispatchCard key={dispatch.id} dispatch={dispatch} index={index} />
                ))}
              </div>
            ) : (
              <p className={EMPTY_STATE}>{t("dispatches.empty")}</p>
            )}
          </div>
        ) : null}

        {tab === "circles" ? (
          <div className="space-y-space-md">
            <PanelHeading title={t("circles.title")} body={t("circles.body")} />

            {circles.length > 0 ? (
              <div className="divide-y divide-outline-variant border-y border-outline-variant">
                {circles.map((member) => (
                  <div key={member.id} className={cn(LEDGER_ROW, "justify-between")}>
                    <div className="flex min-w-0 items-center gap-space-sm">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-surface-container-highest font-label-md font-bold text-on-surface">
                        {initials(member.name)}
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
                    <span className="flex shrink-0 items-center gap-1.5 rounded-md border border-success-border px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] text-success-text uppercase">
                      <Icon name="lock_open" className="text-sm" />
                      {t("circles.unveiled")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={EMPTY_STATE}>{t("circles.empty")}</p>
            )}
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
