"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the account-recovery screens (forgot password, sent
 * confirmation, set new password): a centered bezel card with an accent rail,
 * recovery eyebrow + SSL badge, a support footer, and a below-card trust row.
 * Pass `step` to show the two-chip progress tracker (1 = request, 2 = sent).
 */
export function RecoveryShell({ step, children }: { step?: 1 | 2; children: ReactNode }) {
  const t = useTranslations("Auth.forgotPassword");

  return (
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-md pb-page-mobile lg:px-margin lg:pt-space-xl lg:pb-page">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {step ? (
          <div className="mb-space-lg flex items-center justify-center gap-space-xs">
            {([1, 2] as const).map((n) => {
              const active = step === n;
              return (
                <div
                  key={n}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-space-md py-2 font-label-md text-label-md transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
                    active
                      ? "bg-surface-container-high font-semibold text-on-surface"
                      : "text-secondary",
                  )}
                >
                  <Icon name={n === 1 ? "mail" : "mark_email_read"} className="text-lg" />
                  <span>{t(`step${n}`)}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div
          className="bezel-tray"
          style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
        >
          <div className="overflow-hidden bezel-core">
            <div className="h-1.5 w-full bg-primary" />

            <div className="p-space-lg sm:p-space-xl">
              <div className="mb-space-lg flex flex-wrap items-center justify-between gap-space-sm">
                <span className="font-label-md text-label-md font-semibold text-primary">
                  {t("eyebrow")}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-space-sm py-1 font-label-md text-label-md text-secondary">
                  <Icon name="lock" className="text-base text-success-text" />
                  {t("sslBadge")}
                </span>
              </div>

              {children}
            </div>

            <div className="flex flex-col items-start justify-between gap-space-sm border-t border-outline-variant bg-surface-container px-space-lg py-space-md sm:flex-row sm:items-center">
              <span className="font-body-sm text-body-sm text-secondary">
                {t("supportQuestion")}
              </span>
              <span className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-text-muted">
                {t("supportDesk")}
                <Icon name="arrow_forward" className="text-base" />
              </span>
            </div>
          </div>
        </div>

        <div className="mt-space-md flex flex-col items-center justify-between gap-space-sm sm:flex-row">
          <span className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-secondary">
            <Icon name="check_circle" filled className="text-base text-success-text" />
            {t("supportNote")}
          </span>
          <span className="inline-flex items-center gap-2 font-label-md text-label-md text-text-muted">
            {t("safetyGuide")}
            <span className="text-outline-variant">•</span>
            {t("norms")}
          </span>
        </div>
      </div>
    </section>
  );
}
