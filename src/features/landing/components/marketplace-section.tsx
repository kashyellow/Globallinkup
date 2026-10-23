import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/ui/reveal";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { Link } from "@/lib/i18n/navigation";
import { IMAGES } from "../data";
import { Eyebrow } from "./styles";

const PRODUCTS = [
  { key: "bag", image: IMAGES.productBag },
  { key: "ceramics", image: IMAGES.productCeramics },
  { key: "coffee", image: IMAGES.productCoffee },
] as const;

/**
 * Marketplace strip: three admin-curated goods, each traced to a workshop.
 * Ordering happens on the real marketplace page, so the card CTA links there.
 */
export async function MarketplaceSection() {
  const t = await getTranslations("Landing.marketplace");

  return (
    <section id="marketplace" className="w-full bg-marketing-base py-section-mobile md:py-section">
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile md:px-margin">
        <Reveal className="flex flex-col gap-space-md md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>{t("eyebrow")}</Eyebrow>
            <h2 className="mt-space-sm font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
              {t("title")}
            </h2>
            <p className="mt-space-sm max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
              {t("body")}
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-jade-border bg-jade-surface px-3 py-1.5 font-label-md text-label-md text-jade-bright">
            <Icon name="verified_user" className="text-[16px]" />
            {t("verified")}
          </span>
        </Reveal>

        <ul className="mt-space-xl grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((product, index) => (
            <Reveal as="li" key={product.key} delay={index * 80} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-outline-variant bg-marketing-core shadow-lift-sm transition-shadow duration-500 hover:shadow-lift-md">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-marketing-raised">
                  <MediaImage
                    src={product.image}
                    alt={t(`${product.key}.alt`)}
                    wrapperClassName="h-full w-full"
                  />
                  <span className="absolute top-3 right-3 rounded-full border border-outline-variant bg-marketing-core/95 px-2.5 py-1 font-label-md text-label-md font-semibold text-on-surface backdrop-blur-sm">
                    {t(`${product.key}.price`)}
                  </span>
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 font-label-caps text-label-caps tracking-[0.1em] text-white uppercase backdrop-blur-sm">
                    <Icon name="public" className="text-[13px] text-gold" />
                    {t(`${product.key}.origin`)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2 p-space-lg">
                  <h3 className="font-headline-sm text-headline-sm font-bold text-balance text-on-surface">
                    {t(`${product.key}.name`)}
                  </h3>
                  <p className="font-body-sm text-body-sm text-pretty text-on-surface-variant">
                    {t(`${product.key}.body`)}
                  </p>

                  <Link
                    href="/marketplace"
                    className="mt-auto inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary/30 px-4 font-label-lg text-label-lg text-primary transition-colors duration-300 hover:border-primary/50 hover:bg-marketing-raised focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {t("cta")}
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
