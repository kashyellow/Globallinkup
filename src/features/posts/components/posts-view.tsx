"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";
import { acceptConnectionAction, sendConnectRequestAction } from "@/features/connect/actions";
import { deletePostAction } from "@/features/posts/actions";
import { ConnectDialog, type ConnectTarget } from "@/features/shared/connect-dialog";
import { usePagination } from "@/features/shared/use-pagination";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { POST_FILTERS, type PostFilter } from "../data";
import type { FeedPost } from "../queries";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Posts per page — the feed is a tall single column, so two is a full viewport. */
const PAGE_SIZE = 2;

/** Iberian + LatAm locations, matched against the author's free-text location. */
const SPAIN_LATAM = /Spain|España|Mexico|México|Colombia|Argentina|Chile|Peru|Perú|Portugal/i;

function matchesFilter(post: FeedPost, filter: PostFilter) {
  if (filter === "connectionsOnly") return post.connected;
  if (filter === "spainLatam") return SPAIN_LATAM.test(post.location);
  return true;
}

export function PostsView({
  posts,
  viewer,
}: {
  posts: FeedPost[];
  viewer: { id: string; name: string; avatar: string | null };
}) {
  const t = useTranslations("Posts");
  const router = useRouter();
  const [filter, setFilter] = useState<PostFilter>("all");
  const [target, setTarget] = useState<ConnectTarget | null>(null);
  const visiblePosts = posts.filter((post) => matchesFilter(post, filter));
  const { page, totalPages, pageItems, setPage, resetPage } = usePagination(
    visiblePosts,
    PAGE_SIZE,
  );

  function closeDialog() {
    setTarget(null);
  }

  async function sendRequest(note: string) {
    if (!target) return;
    const recipientId = target.id;
    setTarget(null);
    const result = await sendConnectRequestAction({ recipientId, note });
    if (result.ok) router.refresh();
  }

  async function remove(postId: string) {
    const result = await deletePostAction({ postId });
    if (result.ok) router.refresh();
  }

  async function accept(connectionId: string | undefined) {
    if (!connectionId) return;
    const result = await acceptConnectionAction({ id: connectionId });
    if (result.ok) router.refresh();
  }

  // Changing the filter changes the result set, so the old page index is
  // meaningless. Reset in the handler rather than an effect.
  function changeFilter(next: PostFilter) {
    setFilter(next);
    resetPage();
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      {/* Header */}
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

        <div className="-mx-margin-mobile no-scrollbar flex items-center gap-2 overflow-x-auto px-margin-mobile pb-1 lg:mx-0 lg:px-0 lg:pb-0">
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
                  {visiblePosts.length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="mt-block-mobile grid grid-cols-1 items-start gap-space-lg md:mt-block lg:grid-cols-12">
        <div className="mx-auto flex w-full max-w-[700px] flex-col gap-space-lg lg:col-span-8 lg:mx-0 lg:max-w-none">
          <PostComposer viewerName={viewer.name} viewerAvatar={viewer.avatar} />

          {pageItems.map((post, index) => (
            <PostCard
              key={`${post.id}-${page}-${index}`}
              post={post}
              isAuthor={post.authorId === viewer.id}
              onConnect={() =>
                setTarget({
                  id: post.authorId,
                  name: post.author,
                  location: post.location,
                  image: post.avatar,
                  imageAlt: post.author,
                })
              }
              onAccept={() => void accept(post.connectionId)}
              onDelete={() => void remove(post.id)}
            />
          ))}

          {visiblePosts.length === 0 ? (
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

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            className="mt-space-xs"
          />

          {page === totalPages ? (
            <div className="flex flex-col items-center justify-center gap-2 py-space-md text-center">
              <div className="h-1 w-8 rounded-full bg-outline-variant" />
              <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("end.caughtUp")}
              </p>
              <p className="font-body-sm text-body-sm text-secondary">{t("end.checkBack")}</p>
            </div>
          ) : null}
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
              <span className="pt-1 font-label-lg text-label-lg font-semibold text-text-muted">
                {t("sidebar.readGuidelines")}
              </span>
            </div>
          </div>
        </aside>
      </div>

      <ConnectDialog
        target={target}
        open={target !== null}
        onClose={closeDialog}
        onSend={(note) => void sendRequest(note)}
      />
    </div>
  );
}
