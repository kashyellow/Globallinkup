"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the account-recovery screens (forgot password, sent
 * confirmation, set new password): a centered card with an accent bar,
 * recovery eyebrow + SSL badge, a support footer, and a below-card trust row.
 * Pass `step` to show the two-chip progress tracker (1 = request, 2 = sent).
 */
export function RecoveryShell({ step, children }: { step?: 1 | 2; children: ReactNode }) {
  const t = useTranslations("Auth.forgotPassword");

  return (
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl lg:px-margin">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {step ? (
          <div className="mb-space-lg flex items-center justify-center gap-space-sm">
            {([1, 2] as const).map((n) => {
              const active = step === n;
              return (
                <div
                  key={n}
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-space-md py-2 font-label-md text-label-md transition-all",
                    active
                      ? "border-outline-variant bg-surface-low font-semibold text-on-surface shadow-sm"
                      : "border-transparent text-secondary",
                  )}
                >
                  <Icon name={n === 1 ? "mail" : "mark_email_read"} className="text-[18px]" />
                  <span>{t(`step${n}`)}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-low shadow-lg">
          <div className="h-1.5 w-full bg-primary-container" />

          <div className="p-space-lg sm:p-space-xl">
            <div className="mb-space-lg flex items-center justify-between gap-space-sm">
              <span className="font-label-caps text-label-caps tracking-widest text-primary uppercase">
                {t("eyebrow")}
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-outline-variant bg-surface px-space-sm py-1 font-label-caps text-label-caps text-secondary">
                <Icon name="lock" className="text-[16px] text-tertiary" />
                {t("sslBadge")}
              </span>
            </div>

            {children}
          </div>

          <div className="flex flex-col items-start justify-between gap-space-sm border-t border-outline-variant bg-surface px-space-lg py-space-md sm:flex-row sm:items-center">
            <span className="font-body-sm text-body-sm text-secondary">{t("supportQuestion")}</span>
            <a
              href="#"
              className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-primary transition-colors hover:underline"
            >
              {t("supportDesk")}
              <Icon name="arrow_forward" className="text-[16px]" />
            </a>
          </div>
        </div>

        <div className="mt-space-md flex flex-col items-center justify-between gap-space-sm sm:flex-row">
          <span className="inline-flex items-center gap-1.5 font-body-sm text-body-sm text-secondary">
            <Icon name="check_circle" filled className="text-[16px] text-tertiary" />
            {t("supportNote")}
          </span>
          <span className="inline-flex items-center gap-2 font-label-caps text-label-caps text-secondary">
            {t("safetyGuide")}
            <span className="text-outline-variant">•</span>
            {t("norms")}
          </span>
        </div>
      </div>
    </section>
  );
}
