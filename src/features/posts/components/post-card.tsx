"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { toggleLikeAction } from "@/features/posts/actions";
import { cn } from "@/lib/utils";
import type { FeedPost } from "../queries";

export function PostCard({
  post,
  requested,
  isAuthor,
  onConnect,
  onDelete,
}: {
  post: FeedPost;
  requested: boolean;
  isAuthor: boolean;
  onConnect: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Posts");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const [liked, setLiked] = useState(post.likedByViewer);
  const [likes, setLikes] = useState(post.likes);

  async function like() {
    const next = !liked;
    setLiked(next);
    setLikes((count) => count + (next ? 1 : -1));

    const result = await toggleLikeAction({ postId: post.id, liked: next });
    if (!result.ok) {
      setLiked(!next);
      setLikes((count) => count + (next ? -1 : 1));
    }
  }

  return (
    <article className="bezel-tray">
      <div
        className="flex flex-col overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        {/* Author header */}
        <div className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-sm p-space-lg">
          <div className="flex min-w-0 flex-1 items-center gap-space-md">
            {post.avatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={post.author}
                  className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                  src={post.avatar}
                  loading="lazy"
                />
              </>
            ) : (
              <DefaultAvatar className="h-12 w-12 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <div className="flex min-w-0 flex-col">
              <h2 className="font-label-lg text-label-lg font-semibold text-on-surface">
                {post.author}
              </h2>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-secondary">
                <span className="flex items-center gap-1.5">
                  <Icon name="location_on" className="text-sm" />
                  <span className="font-body-sm text-body-sm">{post.location}</span>
                </span>
                <span aria-hidden className="text-xs text-outline-strong">
                  •
                </span>
                <span className="font-body-sm text-body-sm">
                  {format.relativeTime(new Date(post.createdAt), new Date())}
                </span>
              </div>
            </div>
          </div>

          {isAuthor ? (
            <button
              type="button"
              onClick={onDelete}
              title={t("postMeta.remove")}
              aria-label={t("postMeta.remove")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          ) : post.connected ? (
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text sm:h-auto sm:w-auto sm:gap-1 sm:px-3 sm:py-1">
              <Icon name="check_circle" className="text-sm text-tertiary" />
              <span className="sr-only font-medium text-tertiary sm:not-sr-only">
                {tCommon("connected")}
              </span>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={requested}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-label-md text-label-md transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-2",
                requested
                  ? "border border-success-border bg-success-surface text-success-text"
                  : "border border-outline-variant bg-surface-container text-on-surface-strong hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              <Icon
                name={requested ? "check" : "person_add"}
                className={cn("text-base", requested ? "text-sm text-tertiary" : "text-primary")}
              />
              <span className="sr-only sm:not-sr-only">
                {requested ? t("postMeta.requested") : tCommon("connect")}
              </span>
            </button>
          )}
        </div>

        {/* Editorial photography frame */}
        <div className="group relative aspect-[4/3] w-full overflow-hidden border-y border-outline-variant bg-surface">
          {post.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={post.caption}
                className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                src={post.image}
                loading="lazy"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-surface-variant text-secondary">
              <Icon name="image" className="text-4xl" />
            </div>
          )}
        </div>

        {/* Content & reactions */}
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex min-w-0 items-center gap-space-md">
              <button
                type="button"
                onClick={() => void like()}
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
                  {t("postMeta.likes", { count: likes })}
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

          <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
            <span className="font-semibold text-on-surface">{post.author}</span> {post.caption}
          </p>
        </div>
      </div>
    </article>
  );
}
