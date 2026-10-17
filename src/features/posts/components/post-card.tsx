"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { Post } from "../data";

export function PostCard({ post }: { post: Post }) {
  const t = useTranslations("Posts");
  const tCommon = useTranslations("Common");
  const [liked, setLiked] = useState(false);
  const [requested, setRequested] = useState(false);

  const likeCount = post.likes + (liked ? 1 : 0);
  const timeLabel =
    post.time.kind === "hoursAgo"
      ? t("postMeta.hoursAgo", { count: post.time.value })
      : t("postMeta.yesterday");

  return (
    <article className="bezel-tray">
      <div
        className="flex flex-col overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        {/* Author header */}
        <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-sm p-space-lg">
          {/*
            `flex-1` (basis 0) keeps the name block from claiming its full
            content width, so the connect control shares the row beside the
            name on phones instead of wrapping onto its own line.
          */}
          <div className="flex min-w-0 flex-1 items-center gap-space-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={post.avatarAlt}
              className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
              src={post.avatar}
              loading="lazy"
            />
            <div className="flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {post.author}
                </h2>
                {post.roleText ? (
                  <span className="font-label-md text-label-md text-secondary">
                    {post.roleText}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-secondary">
                <span className="flex items-center gap-1.5">
                  <Icon name="location_on" className="text-sm" />
                  <span className="font-body-sm text-body-sm">{post.location}</span>
                </span>
                <span aria-hidden className="text-xs text-outline-strong">
                  •
                </span>
                <span className="font-body-sm text-body-sm">{timeLabel}</span>
              </div>
            </div>
          </div>

          {/*
            Connect / connected control. Below `sm` it collapses to a 44px icon
            button so it stays beside the author name instead of wrapping onto
            its own row and pushing the photo down; the label returns from `sm`
            up and stays screen-reader visible at every width.
          */}
          {post.state === "connected" ? (
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text sm:h-auto sm:w-auto sm:gap-1 sm:px-3 sm:py-1 xl:h-11 xl:w-11 xl:gap-0 xl:px-0 xl:py-0">
              <Icon name="check_circle" className="text-sm text-tertiary" />
              <span className="sr-only font-medium text-tertiary sm:not-sr-only xl:sr-only">
                {tCommon("connected")}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setRequested(true)}
              disabled={requested}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-label-md text-label-md transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-2 xl:h-11 xl:w-11 xl:gap-0 xl:px-0 xl:py-0",
                requested
                  ? "border border-success-border bg-success-surface text-success-text"
                  : "border border-outline-variant bg-surface-container text-on-surface-strong hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              <Icon
                name={requested ? "check" : "person_add"}
                className={cn("text-base", requested ? "text-sm text-tertiary" : "text-primary")}
              />
              <span className="sr-only sm:not-sr-only xl:sr-only">
                {requested ? t("postMeta.requested") : tCommon("connect")}
              </span>
            </button>
          )}
        </div>

        {/* Editorial photography frame */}
        <div className="group relative aspect-[4/3] w-full overflow-hidden border-y border-outline-variant bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={post.imageAlt}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            src={post.image}
            loading="lazy"
          />
          <span className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
            <Icon name={post.badgeIcon} className="text-xs" />
            <span>{t(`photoBadges.${post.id}`)}</span>
          </span>
        </div>

        {/* Content & reactions */}
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex min-w-0 items-center gap-space-md">
              <button
                type="button"
                onClick={() => setLiked((value) => !value)}
                className="group flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-1 text-on-surface-strong transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon
                  name="favorite"
                  filled={liked}
                  className={cn(
                    "text-2xl transition-transform group-hover:scale-110",
                    liked && "text-primary",
                  )}
                />
                <span className="font-label-md text-label-md font-semibold">
                  {t("postMeta.likes", { count: likeCount })}
                </span>
              </button>
              <button
                type="button"
                className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-1 text-secondary transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="chat_bubble" className="text-2xl" />
                <span className="font-label-md text-label-md">
                  {t("postMeta.notes", { count: post.notes })}
                </span>
              </button>
              <button
                type="button"
                title={t("postMeta.share")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="share" className="text-xl" />
              </button>
            </div>
            <button
              type="button"
              title={t("postMeta.save")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="bookmark" className="text-2xl" />
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
              <span className="font-semibold text-on-surface">{post.author}</span>{" "}
              {t(`captions.${post.id}`)}
            </p>
          </div>

          {post.hasComment ? (
            <div className="flex flex-col gap-space-xs rounded-[0.75rem] border border-outline-variant bg-surface p-space-sm">
              <div className="flex items-start justify-between gap-space-sm">
                <p className="font-body-sm text-body-sm text-on-surface-strong">
                  <span className="font-semibold text-on-surface">
                    {t(`comments.${post.id}Author`)}
                  </span>{" "}
                  {t(`comments.${post.id}Body`)}
                </p>
                <span className="shrink-0 font-label-md text-label-md text-text-muted">
                  {t(`comments.${post.id}Time`)}
                </span>
              </div>
              <span className="pt-1 font-label-md text-label-md text-text-muted">
                {t("postMeta.viewComments", { count: post.notes })}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
