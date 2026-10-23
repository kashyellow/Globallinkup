import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { CTA_GOLD, CTA_ON_DARK, CtaIcon, Eyebrow } from "./styles";

/**
 * Closing panel. The one deliberately dark surface on the light page: a forest
 * slab with a warm gold wash, so the final ask reads as an endpoint rather than
 * another band of content.
 */
export async function ClosingCta() {
  const t = await getTranslations("Landing.cta");

  return (
    <section className="w-full bg-marketing-base px-margin-mobile pb-section-mobile md:px-margin md:pb-section">
      <Reveal className="mx-auto w-full max-w-[1240px]">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary px-margin-mobile py-section-mobile text-center shadow-lift-lg md:px-margin md:py-section">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(46rem_26rem_at_18%_-10%,color-mix(in_oklab,var(--color-gold)_22%,transparent),transparent_70%),radial-gradient(38rem_24rem_at_88%_110%,color-mix(in_oklab,var(--color-jade)_24%,transparent),transparent_72%)]"
          />

          <div className="relative mx-auto max-w-3xl">
            <Eyebrow tone="dark">{t("badge")}</Eyebrow>

            <h2 className="mt-space-md font-display-md text-display-md-mobile font-bold text-balance text-white md:text-display-md">
              {t("title")}
            </h2>
            <p className="mx-auto mt-space-md max-w-[56ch] font-body-lg text-body-lg text-pretty text-white/75">
              {t("body")}
            </p>

            <div className="mt-space-lg flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className={CTA_GOLD}>
                {t("join")}
                <CtaIcon name="north_east" tone="gold" />
              </Link>
              <a href="#how-it-works" className={CTA_ON_DARK}>
                {t("explore")}
                <Icon name="lock" className="text-[18px]" />
              </a>
            </div>

            <p className="mt-space-lg font-label-md text-label-md tracking-[0.08em] text-white/55">
              {t("assurance")}
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
