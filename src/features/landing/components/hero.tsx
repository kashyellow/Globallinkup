import { getTranslations } from "next-intl/server";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Link } from "@/lib/i18n/navigation";
import { IMAGES } from "../data";
import { CTA_PRIMARY, CTA_SECONDARY, CtaIcon, Eyebrow } from "./styles";

/**
 * Hero: text on the left, a deliberately compact persona card on the right.
 *
 * The card only splits into a side column from `lg` up. Below that it stacks
 * under the copy at `max-w-sm` so it never becomes a full-width block, and the
 * detail panel sits below the photograph instead of covering it.
 */
export async function Hero() {
  const t = await getTranslations("Landing.hero");

  const trust = [
    { key: "trust1", icon: "verified_user" },
    { key: "trust2", icon: "auto_awesome" },
    { key: "trust3", icon: "lock" },
  ] as const;

  return (
    <section
      id="hero"
      className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-lg pb-section-mobile md:px-margin md:pt-section md:pb-section"
    >
      <link rel="preload" as="image" href={IMAGES.hero} />
      <div className="grid grid-cols-1 items-center gap-space-xl lg:grid-cols-12 lg:gap-x-space-xl">
        <div className="flex flex-col items-start lg:col-span-7">
          <Eyebrow>{t("badge")}</Eyebrow>

          <h1 className="mt-space-md font-display-lg text-display-lg-mobile font-bold text-balance text-on-surface md:text-display-lg lg:text-display-xl">
            {t("titleLine1")}
            <br />
            <span className="text-gold-strong">{t("titleLine2")}</span>
          </h1>

          <p className="mt-space-md max-w-[52ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
            {t("body")}
          </p>

          <div className="mt-space-lg flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link href="/register" className={CTA_PRIMARY}>
              {t("join")}
              <CtaIcon name="north_east" />
            </Link>
            <Link href="/discover" className={CTA_SECONDARY}>
              {t("explore")}
              <Icon name="arrow_forward" className="text-[18px]" />
            </Link>
          </div>

          <ul className="mt-space-lg flex flex-wrap items-center gap-x-space-lg gap-y-2">
            {trust.map((item) => (
              <li
                key={item.key}
                className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-on-surface-variant"
              >
                <Icon name={item.icon} className="text-[17px] text-primary" />
                {t(item.key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto hidden w-full max-w-xs sm:max-w-sm lg:col-span-5 lg:mx-0 lg:ml-auto lg:block lg:max-w-[26rem]">
          <article className="relative overflow-hidden rounded-[1.5rem] border border-outline-variant bg-marketing-core shadow-lift-lg">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-marketing-raised lg:aspect-[4/5]">
              <MediaImage
                src={IMAGES.hero}
                alt={t("cardAlt")}
                wrapperClassName="h-full w-full"
                loading="eager"
                fetchPriority="high"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 hidden h-44 bg-gradient-to-t from-primary/45 to-transparent lg:block"
              />

              <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-primary/80 px-2.5 py-1 font-label-md text-label-md text-white backdrop-blur-sm">
                <Icon name="location_on" className="text-[14px] text-gold" />
                {t("city")}
              </span>
            </div>

            {/*
             * Static below `lg` (photo stays uncovered); a floating panel over
             * the lower edge from `lg` up, as in the mockup.
             */}
            <div className="border-t border-outline-variant bg-marketing-core p-space-md lg:absolute lg:inset-x-3 lg:bottom-3 lg:rounded-2xl lg:border lg:border-outline-variant lg:bg-marketing-core/97 lg:shadow-lift-md lg:backdrop-blur-md">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <div className="min-w-0">
                  <h2 className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                    {t("name")}
                  </h2>
                  <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-variant">
                    {t("role")}
                  </p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-jade-border bg-jade-surface px-2 py-0.5 font-label-md text-label-md text-jade-bright">
                  <Icon name="verified" filled className="text-[13px]" />
                  {t("verified")}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 font-body-sm text-body-sm text-pretty text-on-surface-variant">
                {t("bio")}
              </p>

              <div className="mt-space-sm flex items-center justify-between gap-3 border-t border-outline-variant pt-space-sm">
                <span className="inline-flex min-w-0 items-center gap-1.5 font-label-md text-label-md text-text-muted">
                  <span
                    aria-hidden
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-jade motion-safe:animate-pulse"
                  />
                  <span className="truncate">{t("ready")}</span>
                </span>
                <Link
                  href="/discover"
                  className="inline-flex shrink-0 items-center gap-1 font-label-md text-label-md font-semibold text-primary transition-colors duration-300 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t("profileCta")}
                  <Icon name="arrow_forward" className="text-[15px]" />
                </Link>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
