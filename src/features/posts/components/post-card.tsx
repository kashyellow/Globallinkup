"use client";

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
  const [showTranslation, setShowTranslation] = useState(false);

  const likeCount = post.likes + (liked ? 1 : 0);
  const timeLabel =
    post.time.kind === "hoursAgo"
      ? t("postMeta.hoursAgo", { count: post.time.value })
      : t("postMeta.yesterday");

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-low shadow-sm">
      {/* Author header */}
      <div className="flex items-center justify-between p-space-lg">
        <div className="flex items-center gap-space-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={post.avatarAlt}
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
            src={post.avatar}
            loading="lazy"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">
                {post.author}
              </h2>
              {post.roleKey ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-tertiary" />
                  <span className="font-label-caps text-label-caps text-tertiary">
                    {t(`roles.${post.roleKey}`)}
                  </span>
                </>
              ) : (
                <span className="font-label-caps text-label-caps text-secondary">
                  {post.roleText}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-secondary">
              <Icon name="location_on" className="text-sm" />
              <span className="font-body-sm text-body-sm">{post.location}</span>
              <span className="text-xs text-outline-strong">•</span>
              <span className="font-body-sm text-body-sm">{timeLabel}</span>
            </div>
          </div>
        </div>

        {post.state === "connected" ? (
          <div className="inline-flex items-center gap-1 rounded-full border border-tertiary/30 bg-success-surface-alt px-3 py-1 font-label-md text-label-md text-success-text">
            <Icon name="check_circle" className="text-sm text-tertiary" />
            <span className="font-medium text-tertiary">{tCommon("connected")}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setRequested(true)}
            disabled={requested}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-label-md text-label-md transition-colors",
              requested
                ? "border border-tertiary/30 bg-success-surface-alt text-success-text"
                : "border border-outline-variant bg-surface-container text-on-surface-strong hover:bg-surface-variant hover:text-on-surface",
            )}
          >
            <Icon
              name={requested ? "check" : "person_add"}
              className={cn("text-base", requested ? "text-sm text-tertiary" : "text-primary")}
            />
            <span>{requested ? t("postMeta.requested") : tCommon("connect")}</span>
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
        <div className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded border border-outline-variant bg-background/80 px-2.5 py-1 font-label-caps text-label-caps text-on-surface-strong shadow-sm backdrop-blur-sm">
          <Icon name={post.badgeIcon} className="text-xs" />
          <span>{t(`photoBadges.${post.id}`)}</span>
        </div>
      </div>

      {/* Content & reactions */}
      <div className="flex flex-col gap-space-md p-space-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={() => setLiked((value) => !value)}
              className="group flex min-h-10 items-center gap-1.5 text-on-surface-strong transition-colors hover:text-primary"
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
              className="flex min-h-10 items-center gap-1.5 text-secondary transition-colors hover:text-on-surface"
            >
              <Icon name="chat_bubble" className="text-2xl" />
              <span className="font-label-md text-label-md">
                {t("postMeta.notes", { count: post.notes })}
              </span>
            </button>
            <button
              type="button"
              title={t("postMeta.share")}
              className="flex h-10 w-10 items-center justify-center text-secondary transition-colors hover:text-on-surface"
            >
              <Icon name="share" className="text-xl" />
            </button>
          </div>
          <button
            type="button"
            title={t("postMeta.save")}
            className="flex h-10 w-10 items-center justify-center text-secondary transition-colors hover:text-primary"
          >
            <Icon name="bookmark" className="text-2xl" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
            <span className="font-semibold text-on-surface">{post.author}</span>{" "}
            {t(`captions.${post.id}`)}
          </p>
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTranslation((value) => !value)}
              className="flex min-h-10 items-center gap-1 font-label-caps text-label-caps text-primary uppercase hover:underline"
            >
              <Icon name={showTranslation ? "undo" : "translate"} className="text-xs" />
              <span>
                {showTranslation
                  ? t("postMeta.hideTranslation")
                  : t("postMeta.seeTranslation", { lang: post.translationLang })}
              </span>
            </button>
          </div>
          {showTranslation ? (
            <p className="mt-2 rounded-lg border border-outline-variant bg-surface p-2.5 font-body-sm text-body-sm text-on-surface-strong italic">
              {t(`captionsTranslated.${post.id}`)}
            </p>
          ) : null}
        </div>

        {post.hasComment ? (
          <div className="flex flex-col gap-space-xs rounded-lg border border-outline-variant bg-surface p-space-sm pt-space-sm">
            <div className="flex items-start justify-between gap-space-sm">
              <p className="font-body-sm text-body-sm text-on-surface-strong">
                <span className="font-semibold text-on-surface">
                  {t(`comments.${post.id}Author`)}
                </span>{" "}
                {t(`comments.${post.id}Body`)}
              </p>
              <span className="shrink-0 font-label-caps text-label-caps text-secondary">
                {t(`comments.${post.id}Time`)}
              </span>
            </div>
            <a
              href="#"
              className="pt-1 font-label-md text-label-md text-secondary hover:text-primary"
            >
              {t("postMeta.viewComments", { count: post.notes })}
            </a>
          </div>
        ) : null}
      </div>
    </article>
  );
}
