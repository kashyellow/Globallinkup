"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { IMAGES } from "../data";
import { Eyebrow } from "./styles";

const MINI_DISPATCHES = [
  { key: "mini1", image: IMAGES.dispatchOne },
  { key: "mini2", image: IMAGES.dispatchTwo },
  { key: "mini3", image: IMAGES.dispatchThree },
] as const;

/**
 * Field dispatches: one featured story on the left, three compact entries in a
 * column on the right. Every card links to the chronological feed.
 */
export function DispatchesSection() {
  const t = useTranslations("Landing.dispatches");

  return (
    <section
      id="dispatches"
      className="w-full border-y border-outline-variant bg-marketing-core py-section-mobile md:py-section"
    >
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <Reveal className="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
              {t("title")}
            </h2>
            <p className="mt-space-sm max-w-[56ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
              {t("body")}
            </p>
          </div>
          <Link
            href="/posts"
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-primary/25 bg-transparent px-4 font-label-lg text-label-lg text-primary transition-colors duration-300 hover:border-primary/45 hover:bg-marketing-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="edit_note" className="text-[18px]" />
            {t("submit")}
          </Link>
        </Reveal>

        <div className="mt-space-xl grid grid-cols-1 gap-space-md lg:grid-cols-12">
          <Reveal className="lg:col-span-8">
            <Link
              href="/posts"
              className="group block h-full overflow-hidden rounded-2xl border border-outline-variant bg-marketing-shell shadow-lift-sm transition-shadow duration-500 hover:shadow-lift-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <article className="flex h-full flex-col">
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-marketing-raised">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("featuredAlt")}
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.02]"
                    src={IMAGES.dispatchFeatured}
                    loading="lazy"
                  />
                  <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1 font-label-md text-label-md text-white backdrop-blur-sm">
                    <Icon name="location_on" className="text-[14px] text-gold" />
                    {t("featuredLocation")}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-space-lg">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-gold-soft font-label-md text-label-md font-bold text-gold-strong">
                      CL
                    </span>
                    <div className="min-w-0">
                      <p className="font-label-lg text-label-lg text-on-surface">
                        {t("featuredAuthor")}
                      </p>
                      <p className="font-body-sm text-body-sm text-text-muted">
                        {t("featuredMeta")}
                      </p>
                    </div>
                    <span className="ml-auto hidden shrink-0 font-body-sm text-body-sm text-text-muted sm:block">
                      {t("featuredTime")}
                    </span>
                  </div>

                  <h3 className="mt-space-md font-headline-md text-headline-md font-bold text-balance text-on-surface">
                    {t("featuredTitle")}
                  </h3>
                  <p className="mt-2 font-body-md text-body-md text-pretty text-on-surface-variant">
                    {t("featuredBody")}
                  </p>

                  <div className="mt-space-md flex flex-col gap-2 rounded-xl border border-outline-variant bg-marketing-core p-space-md sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant italic">
                      {t("featuredQuote")}
                    </p>
                    <span className="inline-flex shrink-0 items-center gap-1.5 font-label-md text-label-md text-primary">
                      <Icon name="favorite" className="text-[16px]" />
                      {t("featuredLikes")}
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1">
            {MINI_DISPATCHES.map((item, index) => (
              <Reveal key={item.key} delay={index * 70}>
                <Link
                  href="/posts"
                  className="group flex h-full gap-space-sm overflow-hidden rounded-2xl border border-outline-variant bg-marketing-core p-space-sm shadow-lift-sm transition-shadow duration-500 hover:shadow-lift-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="relative hidden w-28 shrink-0 overflow-hidden rounded-xl bg-marketing-raised sm:block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.04]"
                      src={item.image}
                      loading="lazy"
                    />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col p-2">
                    <p className="flex items-center gap-1 font-label-caps text-label-caps tracking-[0.08em] text-text-muted uppercase">
                      <Icon name="location_on" className="text-[13px] text-gold-strong" />
                      {t(`${item.key}.location`)}
                    </p>
                    <h3 className="mt-1.5 font-headline-sm text-headline-sm font-bold text-balance text-on-surface">
                      {t(`${item.key}.title`)}
                    </h3>
                    <p className="mt-1 line-clamp-2 font-body-sm text-body-sm text-pretty text-on-surface-variant">
                      {t(`${item.key}.body`)}
                    </p>
                    <p className="mt-auto pt-2 font-label-md text-label-md text-text-muted">
                      {t(`${item.key}.author`)}
                      <span className="text-outline-strong"> · </span>
                      {t(`${item.key}.time`)}
                    </p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
