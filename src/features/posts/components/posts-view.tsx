"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { acceptConnectionAction, sendConnectRequestAction } from "@/features/connect/actions";
import { loadFeedPageAction } from "@/features/posts/feed-actions";
import { deletePostAction } from "@/features/posts/actions";
import { removePostAction } from "@/features/admin/actions";
import { ConnectDialog, type ConnectTarget } from "@/features/shared/connect-dialog";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { POST_FILTERS, POSTS_PAGE_SIZE, type PostFilter } from "../data";
import type { FeedPost } from "../queries";
import { PostCard } from "./post-card";
import { PostComposerDialog } from "./post-composer";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function PostsView({
  initialPosts,
  initialTotal,
  viewer,
}: {
  initialPosts: FeedPost[];
  initialTotal: number;
  viewer: { id: string; name: string; avatar: string | null; isAdmin: boolean };
}) {
  const t = useTranslations("Posts");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();

  const [filter, setFilter] = useState<PostFilter>("all");
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialPosts.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [target, setTarget] = useState<ConnectTarget | null>(null);
  const [requestedPeers, setRequestedPeers] = useState<ReadonlySet<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<FeedPost | null>(null);
  const requestId = useRef(0);

  async function fetchPage(nextFilter: PostFilter, offset: number) {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError(null);

    const result = await loadFeedPageAction({
      filter: nextFilter,
      offset,
      limit: POSTS_PAGE_SIZE,
    }).catch(() => null);

    if (requestId.current !== id) return;

    if (!result || !result.ok) {
      setError(t("feed.loadError"));
      setLoading(false);
      return;
    }

    if (offset === 0) {
      setPosts(result.posts);
    } else {
      setPosts((previous) => {
        const seen = new Set(previous.map((post) => post.id));
        return [...previous, ...result.posts.filter((post) => !seen.has(post.id))];
      });
    }

    setTotal(result.total);
    setHasMore(offset + result.posts.length < result.total);
    setLoading(false);
  }

  function changeFilter(next: PostFilter) {
    if (next === filter && posts.length > 0) return;
    setFilter(next);
    void fetchPage(next, 0);
  }

  function loadMore() {
    if (loading || !hasMore) return;
    void fetchPage(filter, posts.length);
  }

  function handlePublished() {
    setFilter("all");
    window.scrollTo({ top: 0, behavior: "smooth" });
    void fetchPage("all", 0);
  }

  async function sendRequest(note: string): Promise<boolean> {
    if (!target) return false;
    const recipientId = target.id;

    const result = await run(`connect:${recipientId}`, async () => {
      setError(null);
      try {
        const response = await sendConnectRequestAction({ recipientId, note });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setRequestedPeers((previous) => new Set(previous).add(recipientId));
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    return result ?? false;
  }

  async function remove(postId: string) {
    const result = await run(`post:${postId}`, async () => {
      setError(null);
      try {
        const response = viewer.isAdmin
          ? await removePostAction({ postId })
          : await deletePostAction({ postId });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        refresh();
        await fetchPage(filter, 0);
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) setDeleteTarget(null);
  }

  async function accept(connectionId: string | undefined, authorId: string) {
    if (!connectionId) return;

    await run(`accept:${connectionId}`, async () => {
      setError(null);
      try {
        const response = await acceptConnectionAction({ id: connectionId });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return;
        }
        setRequestedPeers((previous) => {
          const next = new Set(previous);
          next.delete(authorId);
          return next;
        });
        refresh();
        await fetchPage(filter, 0);
      } catch {
        setError(tCommon("actionError"));
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div className="flex max-w-2xl flex-col gap-space-sm">
          <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
            {t("eyebrowPrimary")}
          </p>
          <h1 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {t("title")}
          </h1>
          <p className="max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("intro")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className={cn(
            "hidden min-h-12 shrink-0 items-center gap-2 self-start rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary shadow-lift-sm transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px lg:inline-flex",
            EASE,
          )}
        >
          <Icon name="edit" className="text-lg" />
          {t("composer.newPost")}
        </button>
      </div>

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}

      <div className="mt-block-mobile grid grid-cols-1 items-start gap-space-lg md:mt-block lg:grid-cols-12">
        <div className="mx-auto flex w-full max-w-[700px] flex-col gap-space-lg lg:col-span-8 lg:mx-0 lg:max-w-none">
          <div className="bezel-tray">
            <div
              className="flex flex-col gap-space-sm bezel-core p-space-md sm:flex-row sm:items-center sm:justify-between"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="-mx-space-sm no-scrollbar flex items-center gap-2 overflow-x-auto px-space-sm sm:mx-0 sm:px-0">
                {POST_FILTERS.map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => changeFilter(key)}
                    aria-pressed={filter === key}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-label-lg text-label-lg whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                      EASE,
                      filter === key
                        ? "bg-primary font-semibold text-on-primary"
                        : "border border-outline-variant bg-surface-low text-secondary hover:border-outline-hover hover:bg-surface-container hover:text-on-surface",
                    )}
                  >
                    <span>{t(`filters.${key}`)}</span>
                    {filter === key ? (
                      <span className="rounded-full bg-on-primary/20 px-1.5 py-0.5 font-label-caps text-label-caps text-on-primary tabular-nums">
                        {total}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
              <span aria-live="polite" className="font-body-sm text-body-sm text-text-muted">
                {loading ? t("feed.loading") : t("feed.showing", { shown: posts.length, total })}
              </span>
            </div>
          </div>

          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isAuthor={post.authorId === viewer.id}
              isAdmin={viewer.isAdmin}
              canDelete={viewer.isAdmin}
              requested={requestedPeers.has(post.authorId)}
              busy={isPending(`accept:${post.connectionId ?? post.id}`)}
              onConnect={() =>
                setTarget({
                  id: post.authorId,
                  name: post.author,
                  location: post.location,
                  image: post.avatar,
                  imageAlt: post.author,
                })
              }
              onAccept={() => void accept(post.connectionId, post.authorId)}
              onDelete={() => setDeleteTarget(post)}
            />
          ))}

          {!loading && posts.length === 0 ? (
            <div className="bezel-tray">
              <div
                className="flex flex-col items-center gap-space-sm bezel-core p-space-xl text-center"
                style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
              >
                <Icon name="filter_list_off" className="text-3xl text-secondary" />
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t("filters.emptyTitle")}
                </p>
                <p className="max-w-[42ch] font-body-sm text-body-sm text-secondary">
                  {t("filters.emptyBody")}
                </p>
                <button
                  type="button"
                  onClick={() => changeFilter("all")}
                  className="mt-space-xs inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-space-md py-2 font-label-lg text-label-lg font-semibold text-on-surface transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-outline-hover hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  {t("filters.showAll")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-center gap-space-xs pt-space-sm">
            {hasMore ? (
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface shadow-lift-sm transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? (
                  <Spinner className="text-current" label={t("feed.loadingMore")} />
                ) : (
                  <Icon name="expand_more" className="text-lg" />
                )}
                {loading ? t("feed.loadingMore") : t("feed.loadMore")}
              </button>
            ) : posts.length > 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-space-md text-center">
                <div className="h-1 w-8 rounded-full bg-outline-variant" />
                <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t("end.caughtUp")}
                </p>
                <p className="font-body-sm text-body-sm text-secondary">{t("end.checkBack")}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="flex flex-col gap-space-lg lg:sticky lg:top-24 lg:col-span-4">
          <div className="bezel-tray">
            <div
              className="flex flex-col gap-space-sm bezel-core p-space-lg"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-center gap-2">
                <Icon name="auto_awesome" className="text-xl text-primary" />
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("sidebar.aboutTitle")}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-pretty text-secondary">
                {t("sidebar.aboutBody")}
              </p>
              <div className="flex items-center gap-2 pt-space-xs font-label-lg text-label-lg font-semibold text-primary">
                <Icon name="verified" className="text-base" />
                <span>{t("sidebar.humanCurated")}</span>
              </div>
            </div>
          </div>

          <div className="bezel-tray">
            <div
              className="flex flex-col gap-space-xs bezel-core p-space-lg"
              style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
            >
              <div className="flex items-center gap-2">
                <Icon name="favorite_border" className="text-xl text-primary" />
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("sidebar.etiquetteTitle")}
                </h2>
              </div>
              <p className="font-body-sm text-body-sm text-pretty text-secondary">
                {t("sidebar.etiquetteBody")}
              </p>
              <Link
                href="/standards"
                className="inline-flex min-h-11 items-center gap-1.5 self-start font-label-lg text-label-lg font-semibold text-primary transition-colors duration-300 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("sidebar.readGuidelines")}
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <button
        type="button"
        onClick={() => setComposerOpen(true)}
        aria-label={t("composer.newPost")}
        className={cn(
          "fixed right-margin-mobile bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary shadow-lift-lg transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95 lg:hidden",
          EASE,
        )}
      >
        <Icon name="add" className="text-2xl" />
      </button>

      <PostComposerDialog
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onPublished={handlePublished}
        viewerName={viewer.name}
        viewerAvatar={viewer.avatar}
      />

      <ConnectDialog
        target={target}
        open={target !== null}
        onClose={() => setTarget(null)}
        onSend={sendRequest}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title={t("postMeta.remove")}
        body={tCommon("confirmBody")}
        confirmLabel={tCommon("confirmAction")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={deleteTarget ? isPending(`post:${deleteTarget.id}`) : false}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) void remove(deleteTarget.id);
        }}
      />
    </div>
  );
}
