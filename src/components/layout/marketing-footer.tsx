import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

/** Marketing footer used on the public landing page. */
export async function MarketingFooter() {
  const t = await getTranslations("MarketingFooter");

  const navigation = [
    { key: "howItWorks", href: "#how-it-works", isAnchor: true },
    { key: "discoverPeople", href: "/discover", isAnchor: false },
    { key: "communityPosts", href: "/posts", isAnchor: false },
    { key: "artisanMarketplace", href: "/marketplace", isAnchor: false },
  ] as const;

  const trust = [
    { key: "privacyPolicy", href: "#" },
    { key: "connectGuidelines", href: "#" },
    { key: "adminAccess", href: "/admin" },
  ] as const;

  return (
    <footer className="w-full border-t border-[#282622] bg-[#0D0C0B]">
      <div className="mx-auto max-w-[1240px] px-margin-mobile py-space-xl md:px-margin">
        <div className="grid grid-cols-1 gap-space-xl border-b border-[#282622] pb-space-xl md:grid-cols-12">
          <div className="space-y-space-md md:col-span-6">
            <span className="font-headline-md text-headline-md font-semibold tracking-tight text-[#F5F2EB]">
              GlobalLinkup
            </span>
            <p className="max-w-md font-body-md text-body-md text-[#C4BEB5]">{t("blurb")}</p>
            <p className="max-w-md font-body-sm text-body-sm text-[#9E988F] italic">
              {t("blurbAlt")}
            </p>
          </div>

          <div className="space-y-space-sm md:col-span-3">
            <h3 className="font-label-caps text-label-caps tracking-wider text-[#9E988F] uppercase">
              {t("navigationTitle")}
            </h3>
            <ul className="space-y-space-sm">
              {navigation.map((item) => (
                <li key={item.key}>
                  {item.isAnchor ? (
                    <a
                      href={item.href}
                      className="inline-flex min-h-8 items-center py-1 font-body-sm text-body-sm text-[#C4BEB5] transition-colors hover:text-[#F5F2EB]"
                    >
                      {t(`navigation.${item.key}`)}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="inline-flex min-h-8 items-center py-1 font-body-sm text-body-sm text-[#C4BEB5] transition-colors hover:text-[#F5F2EB]"
                    >
                      {t(`navigation.${item.key}`)}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-space-sm md:col-span-3">
            <h3 className="font-label-caps text-label-caps tracking-wider text-[#9E988F] uppercase">
              {t("trustTitle")}
            </h3>
            <ul className="space-y-space-sm">
              {trust.map((item) =>
                item.href === "/admin" ? (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-8 items-center py-1 font-body-sm text-body-sm text-[#C4BEB5] transition-colors hover:text-[#F5F2EB]"
                    >
                      {t(`trust.${item.key}`)}
                    </Link>
                  </li>
                ) : (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      className="inline-flex min-h-8 items-center py-1 font-body-sm text-body-sm text-[#C4BEB5] transition-colors hover:text-[#F5F2EB]"
                    >
                      {t(`trust.${item.key}`)}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-space-md pt-space-lg sm:flex-row">
          <p className="font-body-sm text-body-sm text-[#9E988F]">{t("copyright")}</p>
          <span className="font-label-caps text-label-caps text-[#38a36f]">{t("motto")}</span>
        </div>
      </div>
    </footer>
  );
}
