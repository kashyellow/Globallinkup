import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/ui/brand-mark";
import { Link } from "@/lib/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="mt-auto w-full border-t border-outline-variant bg-surface-low">
      <div className="mx-auto max-w-[1240px] px-margin-mobile py-block-mobile md:px-margin md:py-block">
        <div className="flex flex-col justify-between gap-space-lg md:flex-row md:items-start">
          <div className="flex max-w-sm flex-col gap-space-sm">
            <div className="flex items-center gap-space-sm">
              <BrandMark className="h-6 w-6 shrink-0 text-primary" />
              <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-on-surface">
                GlobalLinkup
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-pretty text-secondary">{t("tagline")}</p>
          </div>

          <nav
            aria-label={t("guidelines")}
            className="flex flex-wrap items-center gap-x-space-lg gap-y-2"
          >
            {/*
             * Legal pages are not built yet. Rendered as plain text rather than
             * an `href="#"` anchor so they are not announced or reachable as
             * interactive controls while leading nowhere.
             */}
            <span className="font-label-lg text-label-lg text-text-muted">{t("privacy")}</span>
            <span className="font-label-lg text-label-lg text-text-muted">{t("guidelines")}</span>
            <Link
              href="/admin"
              className="inline-flex min-h-9 items-center rounded-full px-3 font-label-lg text-label-lg text-secondary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("adminAccess")}
            </Link>
          </nav>
        </div>

        <div className="mt-space-lg border-t border-outline-variant pt-space-md">
          <p className="font-body-sm text-body-sm text-text-muted">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
