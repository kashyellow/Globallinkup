import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

/** Footer for the unauthenticated surfaces. */
export async function PublicFooter() {
  const t = await getTranslations("PublicFooter");

  const links = [
    { key: "privacy", href: "#" },
    { key: "terms", href: "#" },
    { key: "guidelines", href: "#" },
    { key: "safety", href: "#" },
  ] as const;

  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-background py-space-xl">
      <div className="mx-auto max-w-[1240px] px-margin-mobile lg:px-margin">
        <div className="flex flex-col gap-space-lg md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                GlobalLinkup
              </span>
              <span className="rounded-lg border border-outline-variant bg-outline-variant px-space-xs py-0.5 font-label-caps text-label-caps text-on-surface-strong uppercase">
                {t("badge")}
              </span>
            </div>
            <p className="max-w-md font-body-sm text-body-sm text-secondary">{t("tagline")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-x-space-lg gap-y-space-xs">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                className="inline-flex min-h-8 items-center py-1 font-label-lg text-label-lg text-secondary transition-colors hover:text-on-surface"
              >
                {t(link.key)}
              </a>
            ))}
            <Link
              href="/discover"
              className="inline-flex min-h-8 items-center py-1 font-label-lg text-label-lg text-secondary transition-colors hover:text-on-surface"
            >
              {t("explore")}
            </Link>
          </div>
        </div>

        <div className="mt-space-lg flex flex-col gap-space-xs border-t border-outline-variant/50 pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-secondary">{t("copyright")}</p>
          <p className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">
            {t("assurance")}
          </p>
        </div>
      </div>
    </footer>
  );
}
