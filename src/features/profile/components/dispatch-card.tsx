"use client";

import { useFormatter, useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Link } from "@/lib/i18n/navigation";
import type { ProfileDispatch } from "../queries";

export function DispatchCard({
  dispatch,
  index,
  onDelete,
}: {
  dispatch: ProfileDispatch;
  index: number;
  onDelete: () => void;
}) {
  const t = useTranslations("Profile.dispatches");
  const format = useFormatter();
  const date = dispatch.createdAt ? new Date(dispatch.createdAt) : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low transition-colors duration-300 hover:border-outline">
      <Link
        href={`/posts/${dispatch.id}`}
        className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-outline-variant bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
      >
        {dispatch.image ? (
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
        )}
      </Link>

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
          {dispatch.caption ? (
            <p className="mt-2 line-clamp-3 font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
              {dispatch.caption}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-space-sm border-t border-outline-variant pt-space-sm">
          <span className="flex items-center gap-1.5 font-label-md text-label-md text-text-muted">
            <Icon name="favorite" className="text-base text-primary" />
            <span className="tabular-nums">{t("appreciations", { count: dispatch.likes })}</span>
          </span>
          <div className="flex items-center gap-1">
            <Link
              href={`/posts/${dispatch.id}`}
              className="inline-flex min-h-10 items-center rounded-full px-2.5 font-label-md text-label-md font-semibold text-primary transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("openPost")}
            </Link>
            <button
              type="button"
              onClick={onDelete}
              aria-label={t("delete")}
              title={t("delete")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-secondary transition-colors hover:bg-danger-surface hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-border-strong"
            >
              <Icon name="delete" className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
