"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { RecoveryShell } from "./recovery-shell";

export function ResetLinkSentView() {
  const t = useTranslations("Auth.resetLinkSent");

  return (
    <RecoveryShell step={2}>
      <div className="flex flex-col items-center gap-space-md py-space-xs text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary">
          <Icon name="mark_email_read" filled className="text-[32px]" />
        </div>

        <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
          {t("title")}{" "}
          <span className="font-headline-md text-headline-md font-normal text-secondary">
            {t("titleAlt")}
          </span>
        </h1>

        <p className="max-w-md font-body-md text-body-md text-secondary">{t("body")}</p>
        <p className="max-w-md font-body-sm text-body-sm text-secondary">{t("spamHint")}</p>

        <div className="flex flex-col items-center gap-space-sm pt-space-xs">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-primary transition-colors hover:underline"
          >
            <Icon name="refresh" className="text-[18px]" />
            {t("resend")}
          </button>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </RecoveryShell>
  );
}
