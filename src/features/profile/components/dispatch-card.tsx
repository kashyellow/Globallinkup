"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProfileDispatch } from "../queries";

const DAY_MS = 86_400_000;

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.max(0, Math.ceil((target - Date.now()) / DAY_MS));
}

export function DispatchCard({
  dispatch,
  index,
  state,
  busy,
  onArchive,
  onUnarchive,
  onDelete,
}: {
  dispatch: ProfileDispatch;
  index: number;
  state: ProfileDispatch["state"];
  busy: boolean;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Profile.dispatches");
  const format = useFormatter();
  const date = dispatch.createdAt ? new Date(dispatch.createdAt) : null;
  const linkable = state === "visible";
  const remaining = state === "removed" ? daysUntil(dispatch.purgeAfter) : null;

  const media = dispatch.image ? (
    <MediaImage
      src={dispatch.image}
      alt={dispatch.caption}
      wrapperClassName="h-full w-full"
      className="object-contain transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none"
    />
  ) : (
    <span className="flex flex-col items-center gap-2 text-secondary">
      <Icon name="article" className="text-3xl" />
      <span className="font-label-md text-label-md">{t("textOnly")}</span>
    </span>
  );

  const mediaClass =
    "relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-outline-variant bg-surface-container";

  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low transition-colors duration-300 hover:border-outline">
      {linkable ? (
        <Link
          href={`/posts/${dispatch.id}`}
          className={cn(
            mediaClass,
            "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary",
          )}
        >
          {media}
        </Link>
      ) : (
        <div className={mediaClass}>{media}</div>
      )}

      <div className="flex flex-1 flex-col justify-between gap-space-sm p-space-md">
        <div>
          <div className="flex items-center justify-between gap-space-sm font-label-md text-label-md text-text-muted">
            <span className="tracking-[0.08em] uppercase">
              D-{String(index + 1).padStart(2, "0")}
            </span>
            {date && !Number.isNaN(date.getTime()) ? (
              <span suppressHydrationWarning>{format.dateTime(date, "dayMonth")}</span>
            ) : null}
          </div>

          {state !== "visible" ? (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-label-caps text-label-caps uppercase",
                state === "archived"
                  ? "border-outline-variant bg-surface-container text-secondary"
                  : "border-danger-border bg-danger-surface text-danger-text",
              )}
            >
              <Icon
                name={state === "archived" ? "archive" : "visibility_off"}
                className="text-sm"
              />
              {state === "archived" ? t("badgeArchived") : t("badgeRemoved")}
            </span>
          ) : null}

          {dispatch.caption ? (
            <p className="mt-2 line-clamp-3 font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
              {dispatch.caption}
            </p>
          ) : null}

          {state === "removed" ? (
            <div className="mt-2 space-y-1 rounded-xl border border-danger-border bg-danger-surface p-2">
              {dispatch.removedReason ? (
                <p className="font-body-sm text-body-sm text-danger-text">
                  {t("removedReason", { reason: dispatch.removedReason })}
                </p>
              ) : null}
              {remaining !== null ? (
                <p
                  className="font-label-md text-label-md text-danger-text"
                  suppressHydrationWarning
                >
                  {t("purgeCountdown", { count: remaining })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant pt-space-sm">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-text-muted">
            <Icon name="favorite" className="text-base text-primary" />
            <span className="tabular-nums">{t("appreciations", { count: dispatch.likes })}</span>
          </span>

          {state === "removed" ? (
            <span className="font-label-md text-label-md text-text-muted">{t("locked")}</span>
          ) : (
            <div className="flex items-center gap-1">
              {linkable ? (
                <Link
                  href={`/posts/${dispatch.id}`}
                  className="inline-flex min-h-10 items-center rounded-full px-2.5 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t("openPost")}
                </Link>
              ) : null}

              {state === "visible" ? (
                <button
                  type="button"
                  onClick={onArchive}
                  disabled={busy}
                  aria-label={t("archive")}
                  title={t("archive")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  <Icon name="archive" className="text-base" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onUnarchive}
                  disabled={busy}
                  aria-label={t("unarchive")}
                  title={t("unarchive")}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  <Icon name="unarchive" className="text-base" />
                </button>
              )}

              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                aria-label={t("delete")}
                title={t("delete")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-danger-surface hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-border-strong disabled:opacity-50"
              >
                <Icon name="delete" className="text-base" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
