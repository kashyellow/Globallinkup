"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";
import type { Dispatch } from "../data";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Media hover: slow push-in on the photo only, compositor-friendly. */
const MEDIA_IMG =
  "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none";

/** Field entry: numbered register row separated by hairlines, no cards. */
export function DispatchCard({ dispatch, index }: { dispatch: Dispatch; index: number }) {
  const t = useTranslations("Profile.dispatches");
  const format = useFormatter();
  const [appreciated, setAppreciated] = useState(false);

  const single = dispatch.images.length === 1;
  const appreciations = dispatch.appreciations + (appreciated ? 1 : 0);

  return (
    <article className="py-space-lg">
      <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
        <span className="font-label-caps text-label-caps text-primary tabular-nums">
          D-{String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-label-lg text-label-lg font-semibold text-on-surface">
          {dispatch.location}
        </span>
        <span aria-hidden className="text-body-sm text-outline-strong">
          /
        </span>
        <span className="font-label-md text-label-md text-text-muted">{dispatch.medium}</span>
        <span className="ml-auto font-label-md text-label-md text-text-muted tabular-nums">
          {format.dateTime(new Date(dispatch.date), "dayMonth")}
        </span>
      </div>

      <p className="mt-space-sm max-w-[68ch] font-body-md text-body-md leading-relaxed text-on-surface">
        {dispatch.body}
      </p>

      {single ? (
        <div className="group mt-space-md h-72 w-full overflow-hidden border border-outline-variant bg-surface-low">
          <MediaImage
            src={dispatch.images[0].src}
            alt={dispatch.images[0].alt}
            wrapperClassName="h-full w-full"
            className={MEDIA_IMG}
          />
        </div>
      ) : (
        <div className="mt-space-md grid grid-cols-1 gap-space-sm sm:grid-cols-2">
          {dispatch.images.map((image) => (
            <div
              key={image.src}
              className="group h-56 overflow-hidden border border-outline-variant bg-surface-low"
            >
              <MediaImage
                src={image.src}
                alt={image.alt}
                wrapperClassName="h-full w-full"
                className={MEDIA_IMG}
              />
            </div>
          ))}
        </div>
      )}

      {/* Series caption sits under the media, never layered on the photo. */}
      {dispatch.series ? (
        <span className="mt-space-sm flex items-center gap-1.5 font-label-md text-label-md text-text-muted">
          <Icon name="collections_bookmark" className="text-base text-primary" />
          {t("series", { name: dispatch.series })}
        </span>
      ) : null}

      <div className="mt-space-md flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant pt-space-sm">
        <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
          <button
            type="button"
            aria-pressed={appreciated}
            onClick={() => setAppreciated((value) => !value)}
            className={cn(
              "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-outline-variant px-3 font-label-md text-label-md whitespace-nowrap text-text-muted",
              "transition-colors duration-300 hover:border-outline-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:scale-[0.98]",
              EASE,
              appreciated && "border-primary text-primary",
            )}
          >
            <Icon name="favorite" filled={appreciated} className="text-lg" />
            <span className="tabular-nums">{t("appreciations", { count: appreciations })}</span>
          </button>
          <span className="flex min-h-11 items-center gap-1.5 px-1 font-label-md text-label-md whitespace-nowrap text-text-muted">
            <Icon name="chat_bubble" className="text-lg" />
            <span className="tabular-nums">{t("notes", { count: dispatch.notes })}</span>
          </span>
        </div>

        <span className="flex items-center gap-1.5 rounded-md border border-success-border px-2.5 py-1 font-label-md text-label-md font-semibold tracking-[0.08em] whitespace-nowrap text-success-text uppercase">
          <Icon name="lock_open" className="text-sm" />
          <span>{t("circlesOnly")}</span>
        </span>
      </div>
    </article>
  );
}
