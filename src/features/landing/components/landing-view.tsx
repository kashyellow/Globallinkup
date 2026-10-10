"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Reveal } from "@/features/landing/components/reveal";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/*
 * Member photography supplied with the mockups. These are the `/aida-public/`
 * paths, which are publicly readable and confirmed to render in Chromium. The
 * `/aida/` variants 403 or silently fail to decode.
 */
const SOFIA =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAATlSmkEIUqeeL2L5XxBOU6w03gzVzBw2Uzhhca7DwdYW4hDZd4o2AHMBhf1TzL67D6LizWd-FlfVA5rzm36kc_qs9lanO29UHXGB-OSFZtqfLJCv-9QAADdrJu-b1MpnO7Bk7BE5yKrjUuUxCafSczIqtPSB73rF_OXuT5UwFZcwTK2wqBodkDNA66r01n5t9K7H5kFx9Lg8ZtrZYW1pwWrb9focCtsu1qILGbUffIAcWXP7LwBQmuw";
const MATEO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDCFU0bL3A4oN2RIhdhoh597neSOAaZanYDHGukKQQLL1pogb0WZQvIBnAL7VG-JkX4V_uielRcybtUGDICgzKEBNwzLJUdPRZiCO_y2UWD3VJ7DE_vQHfjlx_PWcC-M_SfWaJmGieyTxg19eSasOsK2hnkOobrTdmSNIkLD2MIru6Spq8TVE_JW1KFJ2f1rVhrqRyXxButlKah7ZzdXzIfOcLsBaO-wAGp_8Pl6feAfos4si-SGYBmaw";
const LUCAS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBwRO6qS2H7Ygs_AB7LOW0X_-8bG8zoDFVd3Kr8BOo9wYbfRdIdx43ETLR4DgawMoUjPqrypGduFEhVxWHd_4mhFIxc1g3DwguD5OBU5iNfZerfuDGDBOfNApgWx9e5nHu0c6RboKKI_txR8mLVg40ZjJAHiLJHP3EgUJFkwz6-FLsOJLvH8Aq4YN9NEa6X6bVGkxUAL8sLvLC2ruXWmGDU3L3tAByKveE4NY5r4xFLrnTNIVvAqHuu6w";
const BAG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBVwaZeMZBD75GrApQLCtDSLGJ5dqRB5YjrptEJL_5GtteEz5PSrHzQBAoM-JETyYjHIn4FUt7V2CoJ4ql80SwVllTOoCrNkz-Q08L4lFxS2Zcukm-mWfXAGU4m5LD4iiLlmXzRTaGxkPZx68fsdMAbYz97713s0rdJ1IGMTLaLDu7FNtkyXvC5D3SdXsT-Kl0VfLbW23oqbP_jFT_dkFUrSeEasghPwGvHRhexWonOhqS7Z8fcmEm-CQ";
const STUDIO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDPMukyKSkNklwKos0zIPmrhussBbhIqH_DAe6FwMA840zx1UFDYjAozcSdotXytnwNMuS_QuhFYeBxvEsN8W_6w-mW5WquDMRQSHeiq5_AgLbtm5eRf3pSfR6BvrXAhe2X7EY5lkY1dhOFg5s3JdcnRgDUY1ysC-cbn-BFTNdZslFJEFPzUFwjdMbyNuXSy_-BY8hxhCPpgrmLQi3eOpjokx3tQhQ8Jq7bDUHb3_JoAU-BW_jDCaTVQw";

/** Corner radius scale. One system, applied consistently (see globals.css). */
/*
 * Radius scale. `tray` = 26px and `core` = 20px are deliberately 6px apart:
 * the tray's 0.375rem padding plus that gap is what produces the concentric
 * bezel look. Panels that use the `bezel-tray`/`bezel-core` utilities get these
 * values from CSS; the raw tokens remain for bespoke nesting (hero card slab,
 * dispatch panel) and for chips.
 */
const R = {
  tray: "rounded-[1.625rem]",
  core: "rounded-[1.25rem]",
  chip: "rounded-full",
} as const;

const STEPS = [
  { key: "step1", accent: false },
  { key: "step2", accent: false },
  { key: "step3", accent: false },
  { key: "step4", accent: true },
] as const;

/** Shared primary/secondary CTA treatment, so the same intent looks identical everywhere. */
const CTA_PRIMARY =
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 font-label-lg text-label-lg whitespace-nowrap text-on-primary transition-[background-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-hover hover:shadow-lift-md active:translate-y-px active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const CTA_SECONDARY =
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-outline bg-marketing-core/70 px-6 font-label-lg text-label-lg whitespace-nowrap text-on-surface transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-outline-hover hover:bg-marketing-raised active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Small trailing icon inside its own circle, so the arrow never sits naked. */
function CtaIcon({ name }: { name: string }) {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-primary/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
      <Icon name={name} className="text-[16px]" />
    </span>
  );
}

export function LandingView() {
  const t = useTranslations("Landing");
  const [lockerOpen, setLockerOpen] = useState(false);

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────────
          Asymmetric split: 7 columns of message, 5 of artefact. Four text
          elements only (eyebrow, headline, subtext, CTAs). */}
      <section
        id="hero"
        className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-lg pb-section-mobile md:px-margin md:pt-section md:pb-section"
      >
        <div className="grid grid-cols-1 gap-space-lg lg:grid-cols-12 lg:items-center lg:gap-x-space-xl">
          <div className="flex flex-col items-start lg:col-span-7">
            <p className="rounded-full border border-outline-variant bg-marketing-raised/70 px-3.5 py-1.5 font-label-caps text-label-caps tracking-[0.14em] text-on-surface-variant uppercase">
              {t("hero.badge")}
            </p>

            <h1 className="mt-space-md font-display-lg text-display-lg-mobile font-bold text-balance text-on-surface md:text-display-lg lg:text-display-xl">
              {t("hero.titleLine1")}
              <br />
              <span className="text-primary">{t("hero.titleLine2")}</span>
            </h1>

            <p className="mt-space-sm font-headline-sm text-headline-sm font-medium text-text-muted italic">
              {t("hero.titleAlt")}
            </p>

            <p className="mt-space-md max-w-[52ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
              {t("hero.body")}
            </p>

            <div className="mt-space-lg flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/register" className={CTA_PRIMARY}>
                {t("hero.join")}
                <CtaIcon name="north_east" />
              </Link>
              <Link href="/discover" className={CTA_SECONDARY}>
                {t("hero.explore")}
                <Icon name="arrow_forward" className="text-[18px]" />
              </Link>
            </div>
          </div>

          {/* Persona card, built as a nested tray so it reads as a physical panel. */}
          <div className="relative lg:col-span-5">
            {/* Offset slab behind the card suggests depth and a single light source. */}
            <div
              aria-hidden
              className={cn(
                "absolute -top-4 -right-4 hidden h-full w-full rotate-[1.5deg] border border-outline-variant bg-marketing-shell sm:block",
                R.tray,
              )}
            />

            <div className="relative bezel-tray">
              <div className="overflow-hidden bezel-core">
                <div className="relative aspect-[5/4] w-full overflow-hidden bg-marketing-raised">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("hero.cardAlt")}
                    className="h-full w-full object-cover"
                    src={SOFIA}
                    fetchPriority="high"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-marketing-core via-marketing-core/60 to-transparent"
                  />

                  <span
                    className={cn(
                      "absolute top-4 left-4 inline-flex items-center gap-1.5 border border-outline-variant bg-marketing-base/90 px-3 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm",
                      R.chip,
                    )}
                  >
                    <Icon name="location_on" className="text-[15px] text-primary" />
                    {t("hero.city")}
                  </span>
                </div>

                <div className="space-y-space-md px-space-lg pt-space-md pb-space-lg">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-space-md gap-y-1">
                    <h2 className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                      {t("hero.name")}
                    </h2>
                    <span className="font-label-md text-label-md text-tertiary">
                      {t("hero.languages")}
                    </span>
                  </div>

                  <p className="-mt-2 font-body-sm text-body-sm text-on-surface-variant">
                    {t("hero.role")}
                  </p>

                  <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
                    {t("hero.bio")}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {(["architecture", "photography", "ceramics"] as const).map((key) => (
                      <span
                        key={key}
                        className={cn(
                          "border border-outline-variant bg-marketing-raised px-2.5 py-1 font-label-md text-label-md text-on-surface-variant",
                          R.chip,
                        )}
                      >
                        {t(`hero.interests.${key}`)}
                      </span>
                    ))}
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between gap-3 border border-outline-variant bg-marketing-base p-2 pl-3.5",
                      R.chip,
                    )}
                  >
                    <span className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface">
                      <span
                        aria-hidden
                        className="h-2 w-2 shrink-0 rounded-full bg-tertiary motion-safe:animate-pulse"
                      />
                      {t("hero.ready")}
                    </span>
                    <Link
                      href="/register"
                      className="inline-flex shrink-0 items-center rounded-full bg-primary px-4 py-1.5 font-label-lg text-label-lg whitespace-nowrap text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t("hero.requestConnect")}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sealed-handle note, tucked into the tray's padding rather than floating loose. */}
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4">
                <Icon name="lock" className="shrink-0 text-[18px] text-jade" />
                <p className="font-body-sm text-body-sm text-text-muted">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {t("hero.floatTitle")}
                  </span>{" "}
                  {t("hero.floatBody")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROTOCOL ─────────────────────────────────────────────────────
          A connected rail, not a row of equal cards: a hairline links the four
          stages so the sequence reads as one mechanism. Single eyebrow for this
          third of the page. */}
      <section
        id="how-it-works"
        className="w-full border-y border-outline-variant bg-marketing-shell/60 py-section-mobile md:py-section"
      >
        <div className="mx-auto max-w-[1240px] px-margin-mobile md:px-margin">
          <Reveal className="max-w-2xl">
            <p className="font-label-caps text-label-caps tracking-[0.14em] text-primary uppercase">
              {t("protocol.badge")}
            </p>
            <h2 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
              {t("protocol.title")}
            </h2>
            <p className="mt-space-sm max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
              {t("protocol.body")}
            </p>
          </Reveal>

          {/* Rail: one hairline behind, four stops on top. 4 -> 2 -> 1 columns. */}
          <div className="relative mt-space-xl">
            <div
              aria-hidden
              className="absolute top-6 right-0 left-0 hidden h-px bg-gradient-to-r from-outline-variant via-outline to-outline-variant md:block"
            />

            <ol className="grid grid-cols-1 gap-space-lg md:grid-cols-2 md:gap-x-space-lg md:gap-y-space-xl lg:grid-cols-4">
              {STEPS.map((step, index) => (
                <Reveal as="li" key={step.key} delay={index * 80} className="relative">
                  {/*
                   * Step label sits beside the marker with the number in it, so the
                   * stage name reads as a counter on a rail rather than as another
                   * tracked-caps eyebrow above a heading.
                   */}
                  <div className="flex items-center gap-space-sm">
                    <span
                      className={cn(
                        "relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border font-label-caps text-label-caps font-bold tabular-nums",
                        step.accent
                          ? "border-jade-border bg-jade-surface text-jade-bright"
                          : "border-outline-variant bg-marketing-core text-primary",
                      )}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-label-lg text-label-lg font-semibold",
                        step.accent ? "text-jade" : "text-on-surface",
                      )}
                    >
                      {t(`protocol.${step.key}Label`)}
                    </span>
                  </div>

                  <h3 className="mt-space-md font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {t(`protocol.${step.key}Title`)}
                  </h3>
                  <p className="mt-2 max-w-[38ch] font-body-sm text-body-sm text-pretty text-on-surface-variant">
                    {t(`protocol.${step.key}Body`)}
                  </p>
                </Reveal>
              ))}
            </ol>
          </div>

          {/* Interactive locker demo. */}
          <Reveal className="mt-space-xl">
            <LockerDemo open={lockerOpen} onOpenChange={setLockerOpen} />
          </Reveal>
        </div>
      </section>

      {/* ── PILLARS + COMMUNITY (one asymmetric bento) ───────────────────
          The three product pillars and the community snapshot are the same
          story ("what you get" / "here it is"), so they share a single grid
          instead of two consecutive cards-in-a-row sections. */}
      <section
        id="pillars"
        className="mx-auto w-full max-w-[1240px] px-margin-mobile py-section-mobile md:px-margin md:py-section"
      >
        <Reveal className="max-w-2xl">
          <h2 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
            {t("pillars.title")}
          </h2>
          <p className="mt-space-sm max-w-[55ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("pillars.body")}
          </p>
        </Reveal>

        <div className="mt-space-xl grid grid-cols-1 gap-space-md md:grid-cols-6 lg:grid-cols-12">
          {/* Discover: tall portrait tile, 2 rows on the left rail. */}
          <Reveal className="md:col-span-3 lg:col-span-5 lg:row-span-2">
            <article id="discover-personas" className="h-full">
              <Tray className="h-full">
                <a
                  href="#discover-personas"
                  className="group relative block h-full min-h-[22rem] overflow-hidden bezel-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("snapshot.mateoAlt")}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03]"
                    src={MATEO}
                    loading="lazy"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-marketing-base via-marketing-base/45 to-transparent"
                  />
                  <span
                    className={cn(
                      "absolute top-4 left-4 border border-jade-border bg-jade-surface px-2.5 py-1 font-label-caps text-label-caps tracking-[0.12em] text-jade-bright uppercase shadow-lift-sm",
                      R.chip,
                    )}
                  >
                    {t("snapshot.verified")}
                  </span>

                  <div className="absolute inset-x-0 bottom-0 p-space-lg">
                    <p className="font-label-lg text-label-lg font-semibold text-primary">
                      {t("pillars.pillar1Label")}
                    </p>
                    <h3 className="mt-2 font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                      {t("pillars.pillar1Title")}
                    </h3>
                    <p className="mt-2 max-w-[42ch] font-body-sm text-body-sm text-pretty text-on-surface-strong">
                      {t("pillars.pillar1Body")}
                    </p>
                    <span className="mt-space-md inline-flex items-center gap-1.5 font-label-lg text-label-lg text-primary">
                      {t("pillars.pillar1Cta")}
                      <Icon
                        name="arrow_forward"
                        className="text-[18px] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
                      />
                    </span>
                  </div>
                </a>
              </Tray>
            </article>
          </Reveal>

          {/* Posts: wide photographic tile. */}
          <Reveal delay={80} className="md:col-span-3 lg:col-span-7">
            <article id="editorial-feed" className="h-full">
              <Tray className="h-full">
                <div className="grid h-full grid-cols-1 overflow-hidden bezel-core sm:grid-cols-2">
                  <div className="relative min-h-[13rem] overflow-hidden sm:min-h-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={t("snapshot.postAlt")}
                      className="absolute inset-0 h-full w-full object-cover"
                      src={STUDIO}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-space-sm bg-marketing-core p-space-lg">
                    <p className="font-label-lg text-label-lg font-semibold text-primary">
                      {t("pillars.pillar2Label")}
                    </p>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {t("pillars.pillar2Title")}
                    </h3>
                    <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
                      {t("pillars.pillar2Body")}
                    </p>
                    <Link
                      href="/posts"
                      className="inline-flex w-fit items-center gap-1.5 rounded-full font-label-lg text-label-lg text-primary transition-colors duration-300 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t("pillars.pillar2Cta")}
                      <Icon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </div>
                </div>
              </Tray>
            </article>
          </Reveal>

          {/* Marketplace: product tile. */}
          <Reveal delay={140} className="md:col-span-3 lg:col-span-4">
            <article id="artisan-goods" className="h-full">
              <Tray className="h-full">
                <div className="flex h-full flex-col overflow-hidden bezel-core">
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-marketing-raised">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt={t("snapshot.bagAlt")}
                      className="h-full w-full object-cover"
                      src={BAG}
                      loading="lazy"
                    />
                    <span
                      className={cn(
                        "absolute top-3 left-3 border border-outline-variant bg-marketing-base/92 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm",
                        R.chip,
                      )}
                    >
                      {t("snapshot.bagPrice")}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-space-lg">
                    <p className="font-label-lg text-label-lg font-semibold text-primary">
                      {t("pillars.pillar3Label")}
                    </p>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                      {t("pillars.pillar3Title")}
                    </h3>
                    <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
                      {t("pillars.pillar3Body")}
                    </p>
                    <p className="mt-auto pt-space-sm font-body-sm text-body-sm text-text-muted">
                      {t("snapshot.bagName")}
                    </p>
                    <Link
                      href="/marketplace"
                      className="inline-flex w-fit items-center gap-1.5 rounded-full font-label-lg text-label-lg text-primary transition-colors duration-300 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t("pillars.pillar3Cta")}
                      <Icon name="arrow_forward" className="text-[18px]" />
                    </Link>
                  </div>
                </div>
              </Tray>
            </article>
          </Reveal>

          {/* Third community member: keeps the raster varied instead of three identical cards. */}
          <Reveal delay={200} className="md:col-span-3 lg:col-span-3">
            <SnapshotTile
              image={LUCAS}
              imageAlt={t("snapshot.lucasAlt")}
              name={t("snapshot.lucasName")}
              location={t("snapshot.lucasCity")}
              quote={t("snapshot.lucasQuote")}
              kind={t("snapshot.memberKind")}
              verifiedLabel={t("snapshot.verified")}
            />
          </Reveal>
        </div>

        {/* Featured dispatch. Full-width, so it breaks the grid rhythm. */}
        <Reveal delay={120} className="mt-space-md">
          <Tray>
            <div className="grid grid-cols-1 items-center gap-space-lg overflow-hidden bezel-core p-space-lg lg:grid-cols-12 lg:p-space-xl">
              <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-marketing-raised lg:col-span-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("snapshot.postAlt")}
                  className="h-full w-full object-cover"
                  src={STUDIO}
                  loading="lazy"
                />
              </div>

              <div className="space-y-space-sm lg:col-span-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant bg-marketing-raised font-label-md text-label-md font-bold text-primary">
                    CL
                  </span>
                  <p className="font-label-lg text-label-lg text-on-surface">
                    {t("snapshot.postAuthor")}
                    <span className="font-body-sm font-normal text-text-muted">
                      {" "}
                      / {t("snapshot.postTime")}
                    </span>
                  </p>
                </div>
                <h3 className="font-headline-md text-headline-md font-bold tracking-tight text-balance text-on-surface">
                  {t("snapshot.postTitle")}
                </h3>
                <p className="max-w-[62ch] font-body-md text-body-md text-pretty text-on-surface-variant">
                  {t("snapshot.postBody")}
                </p>
                <p className="max-w-[62ch] font-body-sm text-body-sm text-pretty text-text-muted italic">
                  {t("snapshot.postBodyAlt")}
                </p>
              </div>
            </div>
          </Tray>
        </Reveal>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-[1240px] px-margin-mobile pb-section-mobile md:px-margin md:pb-section">
        <Reveal>
          <div className="relative overflow-hidden rounded-[1.75rem] border border-outline-variant bg-marketing-shell px-margin-mobile py-section-mobile text-center md:px-margin md:py-section">
            {/* Ambient wash, replaces a flat panel background. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_24rem_at_50%_-10%,color-mix(in_oklab,var(--color-primary)_16%,transparent),transparent_70%)]"
            />
            <div className="relative mx-auto max-w-3xl">
              <h2 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
                {t("cta.title")}
              </h2>
              <p className="mt-space-xs font-headline-sm text-headline-sm font-medium text-text-muted italic">
                {t("cta.titleAlt")}
              </p>
              <p className="mx-auto mt-space-md max-w-[56ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
                {t("cta.body")}
              </p>

              <div className="mt-space-lg flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <Link href="/register" className={cn(CTA_PRIMARY, "sm:px-8")}>
                  {t("cta.join")}
                  <CtaIcon name="north_east" />
                </Link>
                <Link href="/discover" className={CTA_SECONDARY}>
                  {t("cta.explore")}
                  <Icon name="arrow_forward" className="text-[18px]" />
                </Link>
              </div>

              <p className="mt-space-lg font-label-md text-label-md tracking-[0.08em] text-text-muted">
                {t("cta.assurance")}
              </p>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

/** Outer tray of the double-bezel surface. */
function Tray({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bezel-tray", className)}>{children}</div>;
}

/** Compact member tile used inside the bento. */
function SnapshotTile({
  image,
  imageAlt,
  name,
  location,
  quote,
  kind,
  verifiedLabel,
}: {
  image: string;
  imageAlt: string;
  name: string;
  location: string;
  quote: string;
  kind: string;
  verifiedLabel: string;
}) {
  return (
    <Tray className="h-full">
      <div className="flex h-full flex-col overflow-hidden bezel-core">
        <div className="relative aspect-[5/4] w-full overflow-hidden bg-marketing-raised">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={imageAlt} className="h-full w-full object-cover" src={image} loading="lazy" />
          <span
            className={cn(
              "absolute top-3 left-3 border border-outline-variant bg-marketing-base/92 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm",
              R.chip,
            )}
          >
            {location}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-space-md">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{name}</h3>
            <span className="shrink-0 font-label-md text-label-md text-jade">{verifiedLabel}</span>
          </div>
          <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">{quote}</p>
          <p className="mt-auto pt-space-sm font-label-md text-label-md text-text-muted">{kind}</p>
        </div>
      </div>
    </Tray>
  );
}

/**
 * The privacy demo: one member, two states of their contact locker.
 *
 * The setter is funnelled through an explicit wrapper rather than being passed
 * straight to `onClick`. React Compiler hoists the handler, and calling a bare
 * `setState` reference from a memoised subtree is not reliably the same thing as
 * calling it from the owning component's scope.
 */
function LockerDemo({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useTranslations("Landing");

  return (
    <div
      className="border border-outline-variant bg-marketing-core p-space-lg md:p-space-xl"
      style={{ borderRadius: R.tray }}
    >
      <div className="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
        <div className="max-w-[48ch]">
          <h3 className="font-headline-md text-headline-md font-bold tracking-tight text-balance text-on-surface">
            {t("demo.title")}
          </h3>
          <p className="mt-1.5 font-body-sm text-body-sm text-pretty text-on-surface-variant">
            {t("demo.body")}
          </p>
        </div>

        <div
          role="group"
          aria-label={t("demo.title")}
          className="inline-flex self-start rounded-full border border-outline-variant bg-marketing-base p-1 md:self-auto"
        >
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-pressed={!open}
            className={cn(
              "rounded-full px-3.5 py-2 font-label-md text-label-md whitespace-nowrap transition-[background-color,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4",
              !open
                ? "bg-primary font-semibold text-on-primary"
                : "text-text-muted hover:text-on-surface",
            )}
          >
            {t("demo.lockedTab")}
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            aria-pressed={open}
            className={cn(
              "rounded-full px-3.5 py-2 font-label-md text-label-md whitespace-nowrap transition-[background-color,color] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:px-4",
              open
                ? "bg-primary font-semibold text-on-primary"
                : "text-text-muted hover:text-on-surface",
            )}
          >
            {t("demo.unlockedTab")}
          </button>
        </div>
      </div>

      <div className="mt-space-lg grid grid-cols-1 items-stretch gap-space-md lg:grid-cols-12">
        {/* Member identity */}
        <div className="flex items-center gap-space-md rounded-xl border border-outline-variant bg-marketing-shell p-space-md lg:col-span-5">
          <span className="h-16 w-16 shrink-0 overflow-hidden rounded-full border border-outline-variant">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img alt={t("demo.miniAlt")} className="h-full w-full object-cover" src={SOFIA} />
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 font-headline-sm text-headline-sm font-bold text-on-surface">
              {t("demo.miniName")}
              <Icon name="verified" className="text-[17px] text-jade" />
            </p>
            <p className="font-body-sm text-body-sm text-text-muted">{t("demo.miniMeta")}</p>
            <p className="mt-2 font-body-sm text-body-sm text-on-surface-variant">
              {t("demo.statusLabel")}:{" "}
              <span className={cn("font-label-lg", open ? "text-jade" : "text-primary")}>
                {open ? t("demo.statusUnlocked") : t("demo.statusLocked")}
              </span>
            </p>
          </div>
        </div>

        {/* Locker itself. `aria-live` announces the state change for screen readers. */}
        <div
          aria-live="polite"
          className="rounded-xl border border-outline-variant bg-marketing-shell p-space-lg lg:col-span-7"
        >
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-space-sm">
            <span className="flex items-center gap-2 font-label-lg text-label-lg font-bold text-on-surface">
              <Icon
                name={open ? "lock_open" : "lock"}
                className={cn("text-[20px]", open ? "text-jade" : "text-text-muted")}
              />
              {open ? t("demo.unlockedTitle") : t("demo.lockedTitle")}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 font-label-caps text-label-caps tracking-[0.12em] uppercase",
                open
                  ? "border-jade-border bg-jade-surface text-jade-bright"
                  : "border-outline bg-marketing-raised text-text-muted",
              )}
            >
              {open ? t("demo.active") : t("demo.encrypted")}
            </span>
          </div>

          <div className="mt-space-md space-y-2">
            {(open
              ? ([
                  { key: "igUnlocked", icon: "photo_camera", action: "openProfile" },
                  { key: "tgUnlocked", icon: "chat", action: "startChat" },
                ] as const)
              : ([
                  { key: "ig", icon: "photo_camera" },
                  { key: "phone", icon: "chat" },
                ] as const)
            ).map((row) => (
              <div
                key={row.key}
                className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-marketing-base p-3"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <Icon
                    name={row.icon}
                    className={cn(
                      "shrink-0 text-[20px]",
                      open ? "text-primary" : "text-text-muted",
                    )}
                  />
                  <span
                    className={cn(
                      "truncate font-body-sm text-body-sm",
                      open
                        ? "font-semibold text-on-surface"
                        : "font-medium text-text-muted blur-[3px] select-none",
                    )}
                  >
                    {open ? t(`demo.${row.key}`) : t(`demo.masked.${row.key}`)}
                  </span>
                </span>

                {open && "action" in row ? (
                  <span className="shrink-0 rounded-full border border-outline-variant bg-marketing-raised px-3 py-1 font-label-md text-label-md text-on-surface">
                    {t(`demo.${row.action}`)}
                  </span>
                ) : (
                  <span className="shrink-0 font-label-caps text-label-caps tracking-[0.12em] text-text-muted uppercase">
                    {t("demo.locked")}
                  </span>
                )}
              </div>
            ))}
          </div>

          <p
            className={cn(
              "mt-space-md flex items-start gap-2 rounded-lg border p-3 font-body-sm text-body-sm",
              open
                ? "border-jade-border bg-jade-surface text-jade-bright"
                : "border-outline-variant bg-marketing-raised text-on-surface-variant",
            )}
          >
            <Icon
              name={open ? "verified" : "info"}
              className={cn("mt-0.5 shrink-0 text-[18px]", open ? "text-jade" : "text-primary")}
            />
            <span>{open ? t("demo.unlockedNote") : t("demo.lockedNote")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
