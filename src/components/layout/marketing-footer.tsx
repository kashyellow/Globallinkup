import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/ui/brand-mark";
import { Link } from "@/lib/i18n/navigation";

/**
 * Marketing footer. Three zones: the brand and its bilingual note, then two
 * short navigation columns. The landing page carries the product story, so the
 * footer's only job is orientation and the required trust links.
 */
export async function MarketingFooter() {
  const t = await getTranslations("MarketingFooter");

  const community = [
    { key: "discoverPeople", href: "/discover" },
    { key: "fieldDispatches", href: "/posts" },
    { key: "artisanMarketplace", href: "/marketplace" },
    { key: "howPrivacyWorks", href: "#how-it-works", isAnchor: true },
  ] as const;

  /*
   * There are no routes for these policies yet, so they render as plain text
   * rather than dead `href="#"` anchors. Swap to `Link` as each page ships.
   */
  const trust = [
    "verifiedIdentity",
    "mutualConsent",
    "artisanProvenance",
    "communityCharter",
  ] as const;

  return (
    <footer className="w-full border-t border-outline-variant bg-marketing-core">
      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-xl pb-space-lg md:px-margin">
        <div className="grid grid-cols-1 gap-space-xl md:grid-cols-12">
          <div className="space-y-space-sm md:col-span-6 lg:col-span-5">
            <span className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary">
                <BrandMark className="h-5 w-5" />
              </span>
              <span className="font-headline-md text-headline-md font-bold tracking-tight text-on-surface">
                GlobalLinkup
              </span>
            </span>
            <p className="max-w-md font-body-sm text-body-sm text-pretty text-on-surface-variant">
              {t("blurb")}
            </p>
            <p className="max-w-md font-body-sm text-body-sm text-pretty text-text-muted italic">
              {t("bilingualNote")}
            </p>
          </div>

          <nav className="md:col-span-3" aria-label={t("communityTitle")}>
            <h2 className="font-label-caps text-label-caps tracking-[0.14em] text-primary uppercase">
              {t("communityTitle")}
            </h2>
            <ul className="mt-space-sm space-y-1">
              {community.map((item) => (
                <li key={item.key}>
                  {"isAnchor" in item ? (
                    <a
                      href={item.href}
                      className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`community.${item.key}`)}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`community.${item.key}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3 lg:col-span-4" aria-label={t("trustTitle")}>
            <h2 className="font-label-caps text-label-caps tracking-[0.14em] text-primary uppercase">
              {t("trustTitle")}
            </h2>
            <ul className="mt-space-sm space-y-1">
              {trust.map((key) => (
                <li key={key}>
                  <span className="inline-flex min-h-11 items-center font-body-sm text-body-sm text-on-surface-variant">
                    {t(`trust.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-space-lg flex flex-col gap-space-sm border-t border-outline-variant pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-text-muted">{t("copyright")}</p>
          <p className="font-label-md text-label-md tracking-[0.08em] text-text-muted">
            {t("motto")}
          </p>
        </div>
      </div>
    </footer>
  );
}
