"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { NETWORK_MEMBERS, POSTS, POST_FILTERS, type Post, type PostFilter } from "../data";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Iberian + LatAm locations, matched against the post's free-text `location`. */
const SPAIN_LATAM = /Spain|España|Mexico|México|Colombia|Argentina|Chile|Peru|Perú/i;

function matchesFilter(post: Post, filter: PostFilter) {
  if (filter === "connectionsOnly") return post.state === "connected";
  if (filter === "spainLatam") return SPAIN_LATAM.test(post.location);
  return true;
}

export function PostsView() {
  const t = useTranslations("Posts");
  const [filter, setFilter] = useState<PostFilter>("all");
  const visiblePosts = POSTS.filter((post) => matchesFilter(post, filter));

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
              onClick={() => setFilter(key)}
              aria-pressed={filter === key}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-label-lg text-label-lg whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
                filter === key
                  ? "bg-primary font-semibold text-on-primary"
                  : "border border-outline-variant bg-surface-low text-secondary hover:border-outline-hover hover:bg-surface-container hover:text-on-surface",
              )}
            >
              <span>{t(`filters.${key}`)}</span>
              {filter === key ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-label-caps text-label-caps tabular-nums",
                    "bg-on-primary/20 text-on-primary",
                  )}
                >
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
          <PostComposer />

          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
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
                  onClick={() => setFilter("all")}
                  className="mt-space-xs inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-space-md py-2 font-label-lg text-label-lg font-semibold text-on-surface transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-outline-hover hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  {t("filters.showAll")}
                </button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-col items-center justify-center gap-2 py-space-md text-center">
            <div className="h-1 w-8 rounded-full bg-outline-variant" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("end.caughtUp")}
            </p>
            <p className="font-body-sm text-body-sm text-secondary">{t("end.checkBack")}</p>
          </div>
        </div>

        <aside className="flex flex-col gap-space-lg lg:sticky lg:top-24 lg:col-span-4">
          {/* Manifesto */}
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

          {/* Active network */}
          <div className="bezel-tray">
            <div
              className="flex flex-col gap-space-md bezel-core p-space-lg"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <div className="flex items-center justify-between gap-space-sm">
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("sidebar.networkTitle")}
                </h2>
                <span className="font-label-lg text-label-lg font-semibold text-text-muted">
                  {t("sidebar.viewAll")}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {NETWORK_MEMBERS.map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between gap-space-sm rounded-[0.75rem] p-2 transition-colors duration-300 hover:bg-surface-container"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={member.avatarAlt}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-outline-variant"
                          src={member.avatar}
                          loading="lazy"
                        />
                        <span
                          className={cn(
                            "absolute right-0 bottom-0 h-2.5 w-2.5 rounded-full ring-2 ring-surface-low",
                            member.online ? "bg-tertiary" : "bg-border-dark",
                          )}
                        />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
                          {member.name}
                        </span>
                        <span className="truncate font-body-sm text-body-sm text-secondary">
                          {member.location}
                        </span>
                      </div>
                    </div>
                    <span
                      title={t("sidebar.sendNote")}
                      aria-hidden
                      className="shrink-0 p-1 text-text-muted"
                    >
                      <Icon name="mail" className="text-lg" />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Etiquette */}
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
              {/* No guidelines page yet: plain text rather than a dead anchor. */}
              <span className="pt-1 font-label-lg text-label-lg font-semibold text-text-muted">
                {t("sidebar.readGuidelines")}
              </span>
            </div>
          </div>

          {/* Language banner */}
          <div className="flex items-center justify-between gap-space-sm px-space-md py-space-sm">
            <div className="flex items-center gap-1.5 font-label-lg text-label-lg text-secondary">
              <Icon name="language" className="text-base" />
              <span>{t("sidebar.feedLanguage")}</span>
            </div>
            <span className="font-label-lg text-label-lg font-semibold text-text-muted">
              {t("sidebar.change")}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
