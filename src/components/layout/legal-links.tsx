import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Shared footer legal row (Terms + Privacy), server-rendered. */
export async function LegalLinks({ className }: { className?: string }) {
  const t = await getTranslations("PublicFooter");

  return (
    <nav
      aria-label={t("legal")}
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}
    >
      <Link
        href="/terms"
        className="font-body-sm text-body-sm text-text-muted underline-offset-2 transition-colors hover:text-on-surface hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t("terms")}
      </Link>
      <span aria-hidden className="text-outline-variant">
        ·
      </span>
      <Link
        href="/privacy"
        className="font-body-sm text-body-sm text-text-muted underline-offset-2 transition-colors hover:text-on-surface hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t("privacy")}
      </Link>
    </nav>
  );
}
