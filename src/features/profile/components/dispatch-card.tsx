"use client";

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
    <article className="overflow-hidden rounded-2xl bg-surface-container shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="space-y-space-md p-space-lg">
        <div className="flex flex-wrap items-center justify-between gap-space-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="pin_drop" className="text-[18px] text-primary" />
            <span className="font-label-md text-label-md font-semibold text-on-surface">
              {dispatch.location}
            </span>
            <span className="text-body-sm text-text-muted">•</span>
            <span className="font-label-caps text-label-caps text-text-muted uppercase">
              {dispatch.medium}
            </span>
          </div>
          <span className="font-label-caps text-label-caps text-text-muted">
            {format.dateTime(new Date(dispatch.date), "dayMonth")}
          </span>
        </div>

        <p className="font-body-md text-body-md leading-relaxed text-on-surface">{dispatch.body}</p>

        {single ? (
          <div className="bg-surface-container-low relative h-72 w-full overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={dispatch.images[0].alt}
              src={dispatch.images[0].src}
              className="h-full w-full object-cover"
            />
            {dispatch.series ? (
              <div className="absolute bottom-3 left-3 rounded-full bg-background/80 px-3 py-1 font-label-caps text-[11px] tracking-wider text-on-surface uppercase backdrop-blur-md">
                {t("series", { name: dispatch.series })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-space-sm">
            {dispatch.images.map((image) => (
              <div
                key={image.src}
                className="bg-surface-container-low h-56 overflow-hidden rounded-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={image.alt} src={image.src} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-space-sm pt-1">
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              aria-pressed={appreciated}
              onClick={() => setAppreciated((value) => !value)}
              className={cn(
                "flex min-h-10 items-center gap-1.5 font-label-md text-label-md transition-colors",
                appreciated ? "text-primary" : "text-text-muted hover:text-primary",
              )}
            >
              <Icon name="favorite" filled={appreciated} className="text-[18px]" />
              <span>{t("appreciations", { count: appreciations })}</span>
            </button>
            <span className="flex min-h-10 items-center gap-1.5 font-label-md text-label-md text-text-muted">
              <Icon name="chat_bubble" className="text-[18px]" />
              <span>{t("notes", { count: dispatch.notes })}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-label-caps text-label-caps font-bold text-tertiary uppercase">
            <Icon name="lock_open" className="text-[16px]" />
            <span>{t("circlesOnly")}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
