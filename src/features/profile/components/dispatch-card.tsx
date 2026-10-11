"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Dispatch } from "../data";

export function DispatchCard({ dispatch }: { dispatch: Dispatch }) {
  const t = useTranslations("Profile.dispatches");
  const format = useFormatter();
  const [appreciated, setAppreciated] = useState(false);

  const single = dispatch.images.length === 1;
  const appreciations = dispatch.appreciations + (appreciated ? 1 : 0);

  return (
    <article className="bezel-tray">
      <div
        className="overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
      >
        <div className="space-y-space-md p-space-lg">
          <div className="flex flex-wrap items-center justify-between gap-x-space-sm gap-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Icon name="pin_drop" className="text-lg text-primary" />
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                {dispatch.location}
              </span>
              <span aria-hidden className="text-body-sm text-text-muted">
                •
              </span>
              <span className="font-label-md text-label-md text-text-muted">{dispatch.medium}</span>
            </div>
            <span className="font-label-md text-label-md text-text-muted tabular-nums">
              {format.dateTime(new Date(dispatch.date), "dayMonth")}
            </span>
          </div>

          <p className="font-body-md text-body-md leading-relaxed text-on-surface">
            {dispatch.body}
          </p>

          {single ? (
            <div className="relative h-72 w-full overflow-hidden rounded-2xl bg-surface-low">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={dispatch.images[0].alt}
                src={dispatch.images[0].src}
                className="h-full w-full object-cover"
              />
              {dispatch.series ? (
                <div className="absolute bottom-3 left-3 rounded-full border border-outline-variant bg-surface-low/95 px-3 py-1 font-label-md text-label-md text-on-surface">
                  {t("series", { name: dispatch.series })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
              {dispatch.images.map((image) => (
                <div key={image.src} className="h-56 overflow-hidden rounded-2xl bg-surface-low">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt={image.alt} src={image.src} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant pt-space-md">
            <div className="flex items-center gap-space-md">
              <button
                type="button"
                aria-pressed={appreciated}
                onClick={() => setAppreciated((value) => !value)}
                className={cn(
                  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 font-label-md text-label-md",
                  "transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                  appreciated ? "text-primary" : "text-text-muted hover:text-primary",
                )}
              >
                <Icon name="favorite" filled={appreciated} className="text-lg" />
                <span className="tabular-nums">{t("appreciations", { count: appreciations })}</span>
              </button>
              <span className="flex min-h-10 items-center gap-1.5 px-1 font-label-md text-label-md text-text-muted">
                <Icon name="chat_bubble" className="text-lg" />
                <span className="tabular-nums">{t("notes", { count: dispatch.notes })}</span>
              </span>
            </div>

            <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
              <Icon name="lock_open" className="text-sm" />
              <span>{t("circlesOnly")}</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
