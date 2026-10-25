"use client";

import type { CSSProperties } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { toggleLikeAction } from "@/features/posts/actions";
import { ReportDialog } from "@/features/reports/components/report-dialog";
import { getPathname, Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { FeedPost } from "../queries";
import { PostCarousel } from "./post-carousel";

export function PostCard({
  post,
  isAuthor,
  requested = false,
  busy = false,
  showComments = true,
  onConnect,
  onAccept,
  onDelete,
}: {
  post: FeedPost;
  isAuthor: boolean;
  requested?: boolean;
  busy?: boolean;
  showComments?: boolean;
  onConnect: () => void;
  onAccept: () => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Posts");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const locale = useLocale();
  const state = requested && post.state !== "connected" ? "requested" : post.state;
  const [liked, setLiked] = useState(post.likedByViewer);
  const [likes, setLikes] = useState(post.likes);
  const [liking, setLiking] = useState(false);
  const [likeError, setLikeError] = useState(false);
  const [shared, setShared] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const authorHref = isAuthor ? "/profile" : `/persona/${post.authorId}`;
  const previewComments = post.comments
    .filter((comment) => comment.parentId === null && comment.deletedAt === null)
    .slice(-2);

  async function like() {
    if (liking) return;
    const next = !liked;
    setLiking(true);
    setLikeError(false);
    setLiked(next);
    setLikes((count) => count + (next ? 1 : -1));

    try {
      const result = await toggleLikeAction({ postId: post.id, liked: next });
      if (!result.ok) {
        setLiked(!next);
        setLikes((count) => count + (next ? -1 : 1));
        setLikeError(true);
      }
    } catch {
      setLiked(!next);
      setLikes((count) => count + (next ? -1 : 1));
      setLikeError(true);
    } finally {
      setLiking(false);
    }
  }

  async function share() {
    const url = `${window.location.origin}${getPathname({
      href: `/posts/${post.id}`,
      locale,
    })}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.caption, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      // Sharing can be cancelled or blocked; no state change needed.
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
            <Link
              href={authorHref}
              className="shrink-0 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {post.avatar ? (
                <MediaImage
                  src={post.avatar}
                  alt={post.author}
                  wrapperClassName="h-12 w-12 rounded-full ring-1 ring-outline-variant"
                />
              ) : (
                <DefaultAvatar className="h-12 w-12 rounded-full ring-1 ring-outline-variant" />
              )}
            </Link>
            <div className="flex min-w-0 flex-col">
              <h2 className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
                <Link
                  href={authorHref}
                  className="rounded transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {post.author}
                </Link>
              </h2>
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-secondary">
                <span className="flex items-center gap-1.5">
                  <Icon name="location_on" className="text-sm" />
                  <span className="font-body-sm text-body-sm">{post.location}</span>
                </span>
                <span aria-hidden className="text-xs text-outline-strong">
                  •
                </span>
                <span className="font-body-sm text-body-sm" suppressHydrationWarning>
                  {format.relativeTime(new Date(post.createdAt), new Date())}
                </span>
              </div>
            </div>
          </div>

          {isAuthor ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              title={t("postMeta.remove")}
              aria-label={t("postMeta.remove")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              <Icon name="delete" className="text-lg" />
            </button>
          ) : state === "connected" ? (
            <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-success-border bg-success-surface text-success-text sm:h-auto sm:w-auto sm:gap-1 sm:px-3 sm:py-1">
              <Icon name="check_circle" className="text-sm text-tertiary" />
              <span className="sr-only font-medium text-tertiary sm:not-sr-only">
                {tCommon("connected")}
              </span>
            </div>
          ) : state === "received" ? (
            <button
              type="button"
              onClick={onAccept}
              disabled={busy}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-1.5 rounded-full border border-success-border bg-success-surface font-label-md text-label-md text-success-text transition-colors duration-300 hover:bg-success-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60 sm:h-auto sm:w-auto sm:px-3.5 sm:py-2"
            >
              {busy ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="check" className="text-base" />
              )}
              <span className="sr-only sm:not-sr-only">
                {busy ? tCommon("processing") : tCommon("accept")}
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnect}
              disabled={busy || state === "requested"}
              className={cn(
                "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-label-md text-label-md transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-3.5 sm:py-2",
                state === "requested"
                  ? "border border-success-border bg-success-surface text-success-text"
                  : "border border-outline-variant bg-surface-container text-on-surface-strong hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              <Icon
                name={state === "requested" ? "check" : "person_add"}
                className={cn(
                  "text-base",
                  state === "requested" ? "text-sm text-tertiary" : "text-primary",
                )}
              />
              <span className="sr-only sm:not-sr-only">
                {state === "requested" ? t("postMeta.requested") : tCommon("connect")}
              </span>
            </button>
          )}
        </div>

        <PostCarousel images={post.images} caption={post.caption} />

        {/* Content & reactions */}
        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex items-center justify-between gap-space-sm">
            <div className="flex min-w-0 items-center gap-space-md">
              <button
                type="button"
                onClick={() => void like()}
                disabled={liking}
                aria-busy={liking || undefined}
                className="group flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-1 text-on-surface-strong transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
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
                onClick={() => void share()}
                title={t("postMeta.share")}
                aria-label={t("postMeta.share")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name={shared ? "check" : "share"} className="text-xl" />
              </button>
            </div>
            <div className="flex items-center gap-1">
              {!isAuthor ? (
                <button
                  type="button"
                  onClick={() => setReportOpen(true)}
                  title={t("postMeta.report")}
                  aria-label={t("postMeta.report")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Icon name="flag" className="text-xl" />
                </button>
              ) : null}
            </div>
          </div>

          <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
            <Link
              href={authorHref}
              className="font-semibold text-on-surface transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {post.author}
            </Link>{" "}
            {post.caption}
          </p>
          {likeError ? (
            <span role="alert" className="sr-only">
              {tCommon("actionError")}
            </span>
          ) : null}

          {showComments && post.commentCount > 0 ? (
            <div className="flex flex-col gap-space-xs border-t border-outline-variant pt-space-sm">
              {previewComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  {comment.avatar ? (
                    <MediaImage
                      src={comment.avatar}
                      alt={comment.author}
                      wrapperClassName="h-7 w-7 shrink-0 rounded-full ring-1 ring-outline-variant"
                    />
                  ) : (
                    <DefaultAvatar className="h-7 w-7 shrink-0 rounded-full ring-1 ring-outline-variant" />
                  )}
                  <p className="min-w-0 font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
                    <span className="font-semibold text-on-surface">{comment.author}</span>{" "}
                    {comment.body}
                  </p>
                </div>
              ))}
              <Link
                href={`/posts/${post.id}`}
                className="self-start font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("postMeta.viewComments", { count: post.commentCount })}
              </Link>
            </div>
          ) : showComments ? (
            <Link
              href={`/posts/${post.id}`}
              className="self-start font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("postMeta.addComment")}
            </Link>
          ) : null}
        </div>
      </div>
      <ReportDialog
        target={{ type: "post", id: post.id, name: post.author }}
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </article>
  );
}
