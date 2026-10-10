"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { NETWORK_MEMBERS, POSTS, POST_FILTERS, type PostFilter } from "../data";
import { PostCard } from "./post-card";
import { PostComposer } from "./post-composer";

export function PostsView() {
  const t = useTranslations("Posts");
  const [filter, setFilter] = useState<PostFilter>("all");

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl md:px-margin">
      {/* Header */}
      <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex max-w-2xl flex-col gap-space-xs">
          <div className="flex items-center gap-space-xs text-secondary">
            <span className="font-label-caps text-label-caps tracking-wider text-primary uppercase">
              {t("eyebrowPrimary")}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("eyebrowSecondary")}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg-mobile tracking-tight text-on-surface md:text-headline-lg">
            {t("title")}
            <span className="ml-1 font-headline-sm text-headline-sm font-normal text-secondary italic">
              / {t("titleAlt")}
            </span>
          </h1>
          <p className="font-body-md text-body-md text-on-surface-strong">{t("intro")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          {POST_FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "flex min-h-9 items-center gap-1 rounded-full px-3.5 py-1.5 font-label-md text-label-md shadow-sm transition-colors",
                filter === key
                  ? "border border-border-dark bg-secondary-container-alt text-on-surface-strong"
                  : "border border-outline-variant bg-surface-low text-secondary hover:border-border-dark hover:text-on-surface",
              )}
            >
              <span>{t(`filters.${key}`)}</span>
              {key === "all" ? (
                <span className="rounded-full border border-outline-variant bg-surface-low px-1.5 py-0.5 font-label-caps text-label-caps text-primary">
                  24
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        <div className="mx-auto flex w-full max-w-[700px] flex-col gap-space-xl lg:col-span-8 lg:mx-0">
          <PostComposer />

          {POSTS.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          <div className="flex flex-col items-center justify-center gap-2 py-space-lg text-center text-secondary">
            <div className="h-1 w-8 rounded-full bg-outline-variant" />
            <p className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("end.caughtUp")}
            </p>
            <p className="font-body-sm text-body-sm">{t("end.checkBack")}</p>
          </div>
        </div>

        <aside className="sticky top-24 flex flex-col gap-space-lg lg:col-span-4">
          {/* Manifesto */}
          <div className="flex flex-col gap-space-sm rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
            <div className="flex items-center gap-2">
              <Icon name="auto_awesome" className="text-xl text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {t("sidebar.aboutTitle")}
              </h3>
            </div>
            <p className="font-body-sm text-body-sm leading-relaxed text-secondary">
              {t("sidebar.aboutBody")}
            </p>
            <div className="flex items-center gap-2 pt-space-xs font-label-md text-label-md font-semibold text-primary">
              <Icon name="verified" className="text-base" />
              <span>{t("sidebar.humanCurated")}</span>
            </div>
          </div>

          {/* Active network */}
          <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("sidebar.networkTitle")}
              </h3>
              <a
                href="#"
                className="inline-flex min-h-10 items-center font-label-caps text-label-caps text-primary uppercase hover:underline"
              >
                {t("sidebar.viewAll")}
              </a>
            </div>
            <div className="flex flex-col gap-space-sm">
              {NETWORK_MEMBERS.map((member) => (
                <div
                  key={member.name}
                  className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-surface-container"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
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
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {member.name}
                      </span>
                      <span className="font-body-sm text-body-sm text-secondary">
                        {member.location}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    title={t("sidebar.sendNote")}
                    className="p-1 text-secondary transition-colors hover:text-primary"
                  >
                    <Icon name="mail" className="text-lg" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Etiquette */}
          <div className="flex flex-col gap-space-xs rounded-xl border border-outline-variant bg-surface-container p-space-lg text-on-surface-strong">
            <div className="flex items-center gap-2">
              <Icon name="favorite_border" className="text-xl text-primary" />
              <span className="font-label-caps text-label-caps font-semibold tracking-wider text-on-surface uppercase">
                {t("sidebar.etiquetteTitle")}
              </span>
            </div>
            <p className="font-body-sm text-body-sm leading-relaxed text-secondary">
              {t("sidebar.etiquetteBody")}
            </p>
            <a
              href="#"
              className="pt-2 font-label-md text-label-md font-semibold text-primary hover:underline"
            >
              {t("sidebar.readGuidelines")}
            </a>
          </div>

          {/* Language banner */}
          <div className="flex items-center justify-between px-space-md py-space-sm text-secondary">
            <div className="flex items-center gap-1.5 font-label-caps text-label-caps">
              <Icon name="language" className="text-base" />
              <span>{t("sidebar.feedLanguage")}</span>
            </div>
            <span className="cursor-pointer font-label-caps text-label-caps text-primary hover:underline">
              {t("sidebar.change")}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
