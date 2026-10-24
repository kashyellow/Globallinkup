"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import type { ProfileDispatch } from "../queries";

/** Media hover: slow push-in on the photo only, compositor-friendly. */
const MEDIA_IMG =
  "h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none";

/** Field entry: numbered register row separated by hairlines, no cards. */
export function DispatchCard({ dispatch, index }: { dispatch: ProfileDispatch; index: number }) {
  const t = useTranslations("Profile.dispatches");
  const format = useFormatter();

  const date = dispatch.createdAt ? new Date(dispatch.createdAt) : null;

  return (
    <article className="py-space-lg">
      <div className="flex items-center gap-x-space-sm">
        <span className="font-label-caps text-label-caps text-primary tabular-nums">
          D-{String(index + 1).padStart(2, "0")}
        </span>
        {date && !Number.isNaN(date.getTime()) ? (
          <span className="ml-auto font-label-md text-label-md text-text-muted tabular-nums">
            {format.dateTime(date, "dayMonth")}
          </span>
        ) : null}
      </div>

      {dispatch.caption ? (
        <p className="mt-space-sm max-w-[68ch] font-body-md text-body-md leading-relaxed text-on-surface">
          {dispatch.caption}
        </p>
      ) : null}

      {dispatch.image ? (
        <div className="group mt-space-md h-72 w-full overflow-hidden border border-outline-variant bg-surface-low">
          <MediaImage
            src={dispatch.image}
            alt={dispatch.caption}
            wrapperClassName="h-full w-full"
            className={MEDIA_IMG}
          />
        </div>
      ) : null}

      <div className="mt-space-md flex flex-wrap items-center gap-space-sm border-t border-outline-variant pt-space-sm">
        <span className="flex min-h-11 items-center gap-1.5 px-1 font-label-md text-label-md whitespace-nowrap text-text-muted">
          <Icon name="favorite" className="text-lg text-primary" />
          <span className="tabular-nums">{t("appreciations", { count: dispatch.likes })}</span>
        </span>
      </div>
    </article>
  );
}
