"use client";

import { useTranslations } from "next-intl";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Inline link to the Privacy Policy page, used by the terms document and register consent. */
export function PrivacyPolicyLink({ className }: { className?: string }) {
  const t = useTranslations("Legal.privacy");

  return (
    <Link
      href="/privacy"
      className={cn(
        "inline font-semibold text-primary underline decoration-dotted underline-offset-2 transition-colors hover:text-primary-hover",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      {t("title")}
    </Link>
  );
}
