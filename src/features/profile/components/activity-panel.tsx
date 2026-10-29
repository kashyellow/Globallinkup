"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useLayoutEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { archivePostAction, deletePostAction, unarchivePostAction } from "@/features/posts/actions";
import { useRefresh } from "@/features/shared/refresh-provider";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProfileDispatch, UnveiledPeer } from "../queries";
import { DispatchCard } from "./dispatch-card";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const DISPATCH_PAGE = 6;
const CIRCLE_PAGE = 8;

const TABS = ["dispatches", "circles"] as const;
type TabId = (typeof TABS)[number];

const DISPATCH_FILTERS = ["active", "archived", "removed"] as const;
type DispatchFilter = (typeof DISPATCH_FILTERS)[number];

function PanelHeading({ title, body }: { title: string; body: string }) {
  return (
    <div className="space-y-1">
      <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h3>
      <p className="max-w-[62ch] font-body-sm text-body-sm text-text-muted">{body}</p>
    </div>
  );
}

const EMPTY_STATE =
  "border-y border-outline-variant py-space-lg text-center font-body-sm text-body-sm text-text-muted";

export function ProfileActivity({
  dispatches,
  circles,
}: {
  dispatches: ProfileDispatch[];
  circles: UnveiledPeer[];
}) {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const [tab, setTab] = useState<TabId>("dispatches");
  const [dispatchCount, setDispatchCount] = useState(DISPATCH_PAGE);
  const [circleCount, setCircleCount] = useState(CIRCLE_PAGE);
  const [removedIds, setRemovedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProfileDispatch | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DispatchFilter>("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [stateOverrides, setStateOverrides] = useState<Record<string, ProfileDispatch["state"]>>(
    {},
  );

  const liveDispatches = dispatches.filter((dispatch) => !removedIds.has(dispatch.id));
  const stateOf = (dispatch: ProfileDispatch) => stateOverrides[dispatch.id] ?? dispatch.state;
  const byState = {
    active: liveDispatches.filter((dispatch) => stateOf(dispatch) === "visible"),
    archived: liveDispatches.filter((dispatch) => stateOf(dispatch) === "archived"),
    removed: liveDispatches.filter((dispatch) => stateOf(dispatch) === "removed"),
  } satisfies Record<DispatchFilter, ProfileDispatch[]>;

  const shownDispatches = byState[filter].slice(0, dispatchCount);
  const shownCircles = circles.slice(0, circleCount);

  const counts: Record<TabId, number> = {
    dispatches: liveDispatches.length,
    circles: circles.length,
  };
  const tabLabels = TABS.map((id) => t(`tabs.${id}`, { count: counts[id] }));

  async function changeState(dispatch: ProfileDispatch, next: "archived" | "visible") {
    setBusyId(dispatch.id);
    setError(null);
    try {
      const result =
        next === "archived"
          ? await archivePostAction({ postId: dispatch.id })
          : await unarchivePostAction({ postId: dispatch.id });
      if (!result.ok) {
        setError(tCommon("actionError"));
        return;
      }
      setStateOverrides((previous) => ({ ...previous, [dispatch.id]: next }));
      refresh();
    } catch {
      setError(tCommon("actionError"));
    } finally {
      setBusyId(null);
    }
  }

  async function removeDispatch() {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deletePostAction({ postId: deleteTarget.id });
      if (!result.ok) {
        setError(tCommon("actionError"));
        return;
      }
      setRemovedIds((previous) => new Set(previous).add(deleteTarget.id));
      refresh();
      setDeleteTarget(null);
    } catch {
      setError(tCommon("actionError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <SectionHead index="05" title={t("sections.archive")} />

      <TabBar tab={tab} onChange={setTab} labels={tabLabels} />

      <div className="mt-space-md">
        {error ? <InlineAlert className="mb-space-md">{error}</InlineAlert> : null}

        {tab === "dispatches" ? (
          <div className="space-y-space-md">
            <PanelHeading title={t("dispatches.title")} body={t("dispatches.body")} />

            <div
              role="group"
              aria-label={t("dispatches.filtersLabel")}
              className="flex flex-wrap gap-1.5"
            >
              {DISPATCH_FILTERS.map((value) => {
                const active = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setFilter(value);
                      setDispatchCount(DISPATCH_PAGE);
                    }}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 font-label-md text-label-md transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      active
                        ? "border-primary bg-primary/15 font-semibold text-primary"
                        : "border-outline-variant text-secondary hover:bg-surface-container hover:text-on-surface",
                    )}
                  >
                    {t(`dispatches.filters.${value}`)}
                    <span className="tabular-nums opacity-70">{byState[value].length}</span>
                  </button>
                );
              })}
            </div>

            {shownDispatches.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                  {shownDispatches.map((dispatch, index) => (
                    <DispatchCard
                      key={dispatch.id}
                      dispatch={dispatch}
                      index={index}
                      state={stateOf(dispatch)}
                      busy={busyId === dispatch.id}
                      onArchive={() => changeState(dispatch, "archived")}
                      onUnarchive={() => changeState(dispatch, "visible")}
                      onDelete={() => setDeleteTarget(dispatch)}
                    />
                  ))}
                </div>
                {byState[filter].length > dispatchCount ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setDispatchCount((count) => count + DISPATCH_PAGE)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                    >
                      <Icon name="expand_more" className="text-lg" />
                      {t("dispatches.loadMore", {
                        count: byState[filter].length - dispatchCount,
                      })}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className={EMPTY_STATE}>{t(`dispatches.empty.${filter}`)}</p>
            )}
          </div>
        ) : null}

        {tab === "circles" ? (
          <div className="space-y-space-md">
            <PanelHeading title={t("circles.title")} body={t("circles.body")} />

            {shownCircles.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2">
                  {shownCircles.map((member) => (
                    <CircleCard key={member.id} member={member} />
                  ))}
                </div>
                {circles.length > circleCount ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setCircleCount((count) => count + CIRCLE_PAGE)}
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                    >
                      <Icon name="expand_more" className="text-lg" />
                      {t("circles.loadMore", { count: circles.length - circleCount })}
                    </button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className={EMPTY_STATE}>{t("circles.empty")}</p>
            )}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("dispatches.deleteTitle")}
        body={t("dispatches.deleteBody")}
        confirmLabel={t("dispatches.delete")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={deleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void removeDispatch()}
      />
    </section>
  );
}

function CircleCard({ member }: { member: UnveiledPeer }) {
  const t = useTranslations("Profile.circles");
  const format = useFormatter();

  return (
    <Link
      href={`/persona/${member.id}`}
      className="group flex items-center gap-space-md rounded-[1.25rem] border border-outline-variant bg-surface-low p-space-md transition-colors duration-300 hover:border-outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {member.avatar ? (
        <MediaImage
          src={member.avatar}
          alt={member.name}
          wrapperClassName="h-16 w-16 shrink-0 rounded-full ring-1 ring-outline-variant"
        />
      ) : (
        <DefaultAvatar className="h-16 w-16 shrink-0 rounded-full ring-1 ring-outline-variant" />
      )}
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface group-hover:text-primary">
          {member.name}
        </h3>
        <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
          <Icon name="location_on" className="text-sm" />
          {member.city}
        </p>
        <p className="mt-1 font-label-md text-label-md text-text-muted" suppressHydrationWarning>
          {t("connectedSince", {
            date: format.dateTime(new Date(member.unlockedAt), "monthYear"),
          })}
        </p>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text">
        <Icon name="lock_open" className="text-base" />
      </span>
    </Link>
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
        void indicator.offsetWidth;
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
    <div className="border-b border-outline-variant">
      <div
        ref={listRef}
        className="relative grid w-full grid-cols-2 items-end gap-space-md sm:flex sm:w-max"
      >
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
                "relative min-h-11 px-1 pb-2 text-center font-label-md text-label-md sm:whitespace-nowrap",
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
