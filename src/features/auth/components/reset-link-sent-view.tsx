"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { RecoveryShell } from "./recovery-shell";

export function ResetLinkSentView() {
  const t = useTranslations("Auth.resetLinkSent");

  return (
    <RecoveryShell step={2} back={{ href: "/login", label: t("backToLogin") }}>
      <div className="flex flex-col items-center gap-space-md py-space-xs text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-primary">
          <Icon name="mark_email_read" filled className="text-3xl" />
        </span>

        <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
          {t("title")}
        </h1>

        <p className="max-w-md font-body-md text-body-md text-secondary">{t("body")}</p>
        <p className="max-w-md font-body-sm text-body-sm text-text-muted">{t("spamHint")}</p>
      </div>
    </RecoveryShell>
  );
}
