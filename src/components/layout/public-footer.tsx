import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/i18n/navigation";

/**
 * Footer for the unauthenticated surfaces.
 *
 * The privacy / terms / guidelines / safety entries are stated as policy notes
 * rather than links: no such routes exist yet, and a footer full of `href="#"`
 * links is worse than no links at all.
 */
export async function PublicFooter() {
  const t = await getTranslations("PublicFooter");

  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-background py-section-mobile md:py-section">
      <div className="mx-auto max-w-[1240px] px-margin-mobile lg:px-margin">
        <div className="flex flex-col gap-space-lg md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                GlobalLinkup
              </span>
              <span className="rounded-full border border-outline-variant bg-surface-container px-space-sm py-0.5 font-label-md text-label-md text-secondary">
                {t("badge")}
              </span>
            </div>
            <p className="max-w-md font-body-sm text-body-sm text-secondary">{t("tagline")}</p>
          </div>

          <nav className="flex flex-col gap-space-sm md:items-end">
            <Link
              href="/discover"
              className="inline-flex min-h-11 items-center rounded-full text-secondary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="font-label-md text-label-md">{t("explore")}</span>
            </Link>
            <ul className="flex flex-col gap-x-space-lg gap-y-1 md:flex-row md:items-center md:gap-x-space-md">
              {(["privacy", "terms", "guidelines", "safety"] as const).map((key) => (
                <li key={key} className="font-body-sm text-body-sm text-text-muted">
                  {t(key)}
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-space-lg flex flex-col gap-space-xs border-t border-outline-variant pt-space-md sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-secondary">{t("copyright")}</p>
          <p className="font-label-md text-label-md text-text-muted">{t("assurance")}</p>
        </div>
      </div>
    </footer>
  );
}
