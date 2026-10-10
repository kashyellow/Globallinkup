import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/ui/brand-mark";
import { Link } from "@/lib/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("Footer");

  return (
    <footer className="w-full border-t border-outline-variant bg-surface py-space-xl">
      <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-space-lg px-margin-mobile text-center md:flex-row md:px-margin md:text-left">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-center gap-space-sm md:justify-start">
            <BrandMark className="h-5 w-5 shrink-0 text-primary-container" />
            <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
              GlobalLinkup
            </span>
          </div>
          <p className="font-body-sm text-body-sm text-text-muted">{t("tagline")}</p>
          <p className="font-label-md text-label-md text-text-muted">{t("copyright")}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-space-lg">
          <a
            href="#"
            className="inline-flex min-h-8 items-center py-1 font-label-md text-label-md text-secondary transition-colors hover:text-primary-container"
          >
            {t("privacy")}
          </a>
          <a
            href="#"
            className="inline-flex min-h-8 items-center py-1 font-label-md text-label-md text-secondary transition-colors hover:text-primary-container"
          >
            {t("guidelines")}
          </a>
          <Link
            href="/admin"
            className="inline-flex min-h-8 items-center py-1 font-label-md text-label-md text-secondary transition-colors hover:text-primary-container"
          >
            {t("adminAccess")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
