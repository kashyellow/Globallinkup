"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

export function ResetLinkSentView() {
  const t = useTranslations("Auth.resetLinkSent");

  return (
    <RecoveryShell step={2}>
      <div className="flex flex-col items-center gap-space-md py-space-xs text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary">
          <Icon name="mark_email_read" filled className="text-3xl" />
        </span>

        <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
          {t("title")}
        </h1>

        <p className="max-w-md font-body-md text-body-md text-secondary">{t("body")}</p>
        <p className="max-w-md font-body-sm text-body-sm text-text-muted">{t("spamHint")}</p>

        <div className="flex flex-col items-center gap-space-xs pt-space-xs">
          <Link
            href="/login"
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-full px-space-md py-2 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary",
              EASE,
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            )}
          >
            <Icon name="arrow_back" className="text-lg" />
            {t("backToLogin")}
          </Link>
        </div>
      </div>
    </RecoveryShell>
  );
}
