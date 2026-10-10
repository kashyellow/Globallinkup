import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

/**
 * Marketing footer. Deliberately light: two navigational columns, one legal
 * line. The landing page already carries the product story, so the footer's
 * only job is orientation and the required legal links.
 */
export async function MarketingFooter() {
  const t = await getTranslations("MarketingFooter");

  const navigation = [
    { key: "howItWorks", href: "#how-it-works", isAnchor: true },
    { key: "discoverPeople", href: "/discover", isAnchor: false },
    { key: "communityPosts", href: "/posts", isAnchor: false },
    { key: "artisanMarketplace", href: "/marketplace", isAnchor: false },
  ] as const;

  const legal = [
    { key: "privacyPolicy", href: "#" },
    { key: "connectGuidelines", href: "#" },
    { key: "adminAccess", href: "/admin" },
  ] as const;

  return (
    <footer className="w-full border-t border-outline-variant bg-marketing-base/80">
      <div className="mx-auto max-w-[1240px] px-margin-mobile py-space-lg md:px-margin">
        <div className="grid grid-cols-1 gap-space-lg md:grid-cols-12">
          <div className="space-y-space-sm md:col-span-6">
            <span className="font-headline-md text-headline-md font-semibold tracking-tight text-on-surface">
              GlobalLinkup
            </span>
            <p className="max-w-md font-body-sm text-body-sm text-pretty text-on-surface-variant">
              {t("blurb")}
            </p>
          </div>

          <nav className="md:col-span-3" aria-label={t("navigationTitle")}>
            <h2 className="font-label-caps text-label-caps tracking-[0.14em] text-text-muted uppercase">
              {t("navigationTitle")}
            </h2>
            <ul className="mt-space-sm space-y-1">
              {navigation.map((item) => (
                <li key={item.key}>
                  {item.isAnchor ? (
                    <a
                      href={item.href}
                      className="inline-flex min-h-8 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`navigation.${item.key}`)}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-8 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`navigation.${item.key}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-3" aria-label={t("trustTitle")}>
            <h2 className="font-label-caps text-label-caps tracking-[0.14em] text-text-muted uppercase">
              {t("trustTitle")}
            </h2>
            <ul className="mt-space-sm space-y-1">
              {legal.map((item) => (
                <li key={item.key}>
                  {item.href === "/admin" ? (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-8 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`trust.${item.key}`)}
                    </Link>
                  ) : (
                    <a
                      href={item.href}
                      className="inline-flex min-h-8 items-center font-body-sm text-body-sm text-on-surface-variant transition-colors duration-300 hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {t(`trust.${item.key}`)}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-space-lg flex flex-col gap-space-sm border-t border-outline-variant pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-text-muted">{t("copyright")}</p>
          <p className="font-label-md text-label-md text-text-muted">{t("motto")}</p>
        </div>
      </div>
    </footer>
  );
}
