"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { createCommentAction, deleteCommentAction } from "@/features/posts/comment-actions";
import type { FeedComment } from "@/features/posts/queries";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const MAX_BODY = 1000;
const ROOT_PAGE = 5;

export function PostComments({
  postId,
  comments: initialComments,
  viewer,
}: {
  postId: string;
  comments: FeedComment[];
  viewer: { id: string; name: string; avatar: string | null; isAdmin: boolean };
}) {
  const t = useTranslations("Posts.comments");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const [comments, setComments] = useState(initialComments);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<FeedComment | null>(null);
  const [visibleRoots, setVisibleRoots] = useState(ROOT_PAGE);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const roots = comments
    .filter((comment) => comment.parentId === null)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const repliesByParent = new Map<string, FeedComment[]>();
  for (const comment of comments) {
    if (!comment.parentId) continue;
    const list = repliesByParent.get(comment.parentId) ?? [];
    list.push(comment);
    repliesByParent.set(comment.parentId, list);
  }

  const canSubmit = body.trim().length > 0 && body.length <= MAX_BODY && !pending;

  function beginReply(comment: FeedComment) {
    setReplyTo(comment);
    setError(null);
    inputRef.current?.focus();
  }

  async function submit() {
    if (!canSubmit) return;

    setPending(true);
    setError(null);
    try {
      const result = await createCommentAction({
        postId,
        parentId: replyTo?.id,
        body,
      });
      if (!result.ok) {
        setError(tCommon("actionError"));
        return;
      }

      const created: FeedComment = {
        id: result.id ?? `local-${Date.now()}`,
        postId,
        authorId: viewer.id,
        author: viewer.name,
        avatar: viewer.avatar,
        body: body.trim(),
        parentId: replyTo?.id ?? null,
        createdAt: new Date().toISOString(),
        deletedAt: null,
      };
      setComments((current) => [...current, created]);
      setBody("");
      setReplyTo(null);
      if (!replyTo) setVisibleRoots((count) => count + 1);
    } catch {
      setError(tCommon("actionError"));
    } finally {
      setPending(false);
    }
  }

  async function remove(comment: FeedComment) {
    setPending(true);
    setError(null);
    try {
      const result = await deleteCommentAction({ commentId: comment.id });
      if (!result.ok) {
        setError(tCommon("actionError"));
        return;
      }
      setComments((current) =>
        current.map((item) =>
          item.id === comment.id ? { ...item, deletedAt: new Date().toISOString() } : item,
        ),
      );
    } catch {
      setError(tCommon("actionError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="bezel-tray">
      <div className="flex flex-col gap-space-lg bezel-core p-space-lg">
        <div>
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {t("title", { count: comments.filter((comment) => !comment.deletedAt).length })}
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-secondary">{t("body")}</p>
        </div>

        {error ? <InlineAlert>{error}</InlineAlert> : null}

        {roots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container py-space-xl text-center">
            <Icon name="chat_bubble_outline" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
            <p className="max-w-[42ch] font-body-sm text-body-sm text-secondary">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {roots.slice(0, visibleRoots).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                replies={repliesByParent.get(comment.id) ?? []}
                viewer={viewer}
                pending={pending}
                sentAgo={format.relativeTime(new Date(comment.createdAt), new Date())}
                onReply={beginReply}
                onDelete={(target) => void remove(target)}
              />
            ))}
          </div>
        )}

        {roots.length > visibleRoots ? (
          <button
            type="button"
            onClick={() => setVisibleRoots((count) => count + ROOT_PAGE)}
            className="self-start font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("loadMore", { count: roots.length - visibleRoots })}
          </button>
        ) : null}

        <div className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md">
          <div className="flex items-center gap-space-sm">
            {viewer.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={viewer.name}
                src={viewer.avatar}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
              />
            ) : (
              <DefaultAvatar className="h-8 w-8 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <div className="min-w-0">
              <p className="truncate font-label-md text-label-md font-semibold text-on-surface">
                {viewer.name}
              </p>
              {replyTo ? (
                <p className="truncate font-body-sm text-body-sm text-secondary">
                  {t("replyingTo", { name: replyTo.author })}{" "}
                  <button
                    type="button"
                    onClick={() => setReplyTo(null)}
                    className="font-semibold text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {t("cancelReply")}
                  </button>
                </p>
              ) : null}
            </div>
          </div>

          <textarea
            ref={inputRef}
            rows={3}
            maxLength={MAX_BODY}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              if (error) setError(null);
            }}
            disabled={pending}
            placeholder={
              replyTo ? t("replyPlaceholder", { name: replyTo.author }) : t("placeholder")
            }
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-low p-space-md font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70"
          />

          <div className="flex items-center justify-between gap-space-sm">
            <span className="font-body-sm text-body-sm text-secondary tabular-nums">
              {body.length} / {MAX_BODY}
            </span>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={!canSubmit}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-label-lg text-label-lg font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60",
                canSubmit
                  ? "bg-primary text-on-primary hover:bg-primary-hover"
                  : "bg-surface-container-high text-text-muted",
              )}
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="send" className="text-base" />
              )}
              {pending ? tCommon("processing") : replyTo ? t("reply") : t("submit")}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CommentItem({
  comment,
  replies,
  viewer,
  pending,
  sentAgo,
  onReply,
  onDelete,
}: {
  comment: FeedComment;
  replies: FeedComment[];
  viewer: { id: string; name: string; avatar: string | null; isAdmin: boolean };
  pending: boolean;
  sentAgo: string;
  onReply: (comment: FeedComment) => void;
  onDelete: (comment: FeedComment) => void;
}) {
  const t = useTranslations("Posts.comments");
  const format = useFormatter();
  const deleted = comment.deletedAt !== null;

  return (
    <div className="flex flex-col gap-space-sm py-space-md first:pt-0 last:pb-0">
      <div className="flex items-start gap-space-sm">
        {comment.avatar && !deleted ? (
          <MediaImage
            src={comment.avatar}
            alt={comment.author}
            wrapperClassName="h-9 w-9 shrink-0 rounded-full ring-1 ring-outline-variant"
          />
        ) : (
          <DefaultAvatar className="h-9 w-9 shrink-0 rounded-full ring-1 ring-outline-variant" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {deleted ? (
              <span className="font-label-md text-label-md font-semibold text-text-muted">
                {t("deletedAuthor")}
              </span>
            ) : (
              <Link
                href={comment.authorId === viewer.id ? "/profile" : `/persona/${comment.authorId}`}
                className="font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {comment.author}
              </Link>
            )}
            <span className="font-body-sm text-body-sm text-text-muted" suppressHydrationWarning>
              {sentAgo}
            </span>
          </div>
          <p
            className={cn(
              "mt-0.5 font-body-sm text-body-sm leading-relaxed",
              deleted ? "text-text-muted italic" : "text-on-surface-strong",
            )}
          >
            {deleted ? t("deletedBody") : comment.body}
          </p>
          <div className="mt-1 flex items-center gap-3">
            {!deleted ? (
              <button
                type="button"
                onClick={() => onReply(comment)}
                className="font-label-md text-label-md font-semibold text-secondary transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("replyAction")}
              </button>
            ) : null}
            {!deleted && viewer.isAdmin ? (
              <button
                type="button"
                onClick={() => onDelete(comment)}
                disabled={pending}
                className="font-label-md text-label-md text-secondary transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                {t("deleteAction")}
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {replies.length > 0 ? (
        <div className="ml-6 flex flex-col gap-space-sm border-l border-outline-variant pl-space-md sm:ml-8">
          {replies
            .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            .map((reply) => {
              const replyDeleted = reply.deletedAt !== null;
              return (
                <div key={reply.id} className="flex items-start gap-space-sm">
                  {reply.avatar && !replyDeleted ? (
                    <MediaImage
                      src={reply.avatar}
                      alt={reply.author}
                      wrapperClassName="h-8 w-8 shrink-0 rounded-full ring-1 ring-outline-variant"
                    />
                  ) : (
                    <DefaultAvatar className="h-8 w-8 shrink-0 rounded-full ring-1 ring-outline-variant" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {replyDeleted ? (
                        <span className="font-label-md text-label-md font-semibold text-text-muted">
                          {t("deletedAuthor")}
                        </span>
                      ) : (
                        <Link
                          href={
                            reply.authorId === viewer.id ? "/profile" : `/persona/${reply.authorId}`
                          }
                          className="font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        >
                          {reply.author}
                        </Link>
                      )}
                      <span
                        className="font-body-sm text-body-sm text-text-muted"
                        suppressHydrationWarning
                      >
                        {format.relativeTime(new Date(reply.createdAt), new Date())}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "mt-0.5 font-body-sm text-body-sm leading-relaxed",
                        replyDeleted ? "text-text-muted italic" : "text-on-surface-strong",
                      )}
                    >
                      {replyDeleted ? t("deletedBody") : reply.body}
                    </p>
                    {!replyDeleted && viewer.isAdmin ? (
                      <button
                        type="button"
                        onClick={() => onDelete(reply)}
                        disabled={pending}
                        className="mt-1 font-label-md text-label-md text-secondary transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                      >
                        {t("deleteAction")}
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
}
