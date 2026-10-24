"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Left-aligned “Back to home” used above auth form headings. */
export function AuthBackLink({ className }: { className?: string }) {
  const t = useTranslations("PublicNav");

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-h-11 w-fit items-center gap-1.5 font-label-md text-label-md text-secondary transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <Icon name="arrow_back" className="text-base" />
      {t("backHome")}
    </Link>
  );
}
