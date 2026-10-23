import { getTranslations } from "next-intl/server";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("Common");

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-space-md px-margin-mobile py-page-mobile text-center md:px-margin md:py-page">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-secondary">
        <Icon name="search_off" className="text-2xl" />
      </span>
      <h1 className="font-headline-lg text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
        {t("notFoundTitle")}
      </h1>
      <p className="max-w-[46ch] font-body-md text-body-md text-secondary">{t("notFoundBody")}</p>
      <Link
        href="/"
        className="mt-space-xs inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-container px-space-lg font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <Icon name="arrow_back" className="text-lg" />
        {t("backHome")}
      </Link>
    </div>
  );
}
