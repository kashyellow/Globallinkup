"use client";

import type { CSSProperties, ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Shared chrome for the account-recovery screens (forgot password, sent
 * confirmation, set new password): a centered bezel card with an accent rail,
 * recovery eyebrow, and optional step tracker. Back navigation sits above the
 * tracker so it reads as the first step, not a footer action.
 */
export function RecoveryShell({
  step,
  back,
  children,
}: {
  step?: 1 | 2;
  back?: { href: string; label: string };
  children: ReactNode;
}) {
  const t = useTranslations("Auth.forgotPassword");

  return (
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-md pb-page-mobile lg:px-margin lg:pt-space-xl lg:pb-page">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        {back ? (
          <Link
            href={back.href}
            className="mb-space-sm inline-flex min-h-11 w-fit items-center gap-1.5 font-label-md text-label-md text-secondary transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="arrow_back" className="text-base" />
            {back.label}
          </Link>
        ) : null}

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
              <div className="mb-space-lg">
                <span className="font-label-md text-label-md font-semibold text-primary">
                  {t("eyebrow")}
                </span>
              </div>

              {children}
            </div>

            <div className="flex flex-col items-start justify-between gap-space-sm border-t border-outline-variant bg-surface-container px-space-lg py-space-md sm:flex-row sm:items-center">
              <span className="font-body-sm text-body-sm text-secondary">
                {t("supportQuestion")}
              </span>
              <Link
                href="/support"
                className="inline-flex items-center gap-1 font-label-md text-label-md font-semibold text-text-muted transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("supportDesk")}
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-space-md flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:justify-start">
          <Link
            href="/safety"
            className="font-label-md text-label-md text-text-muted transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("safetyGuide")}
          </Link>
          <span aria-hidden className="text-outline-variant">
            •
          </span>
          <Link
            href="/standards"
            className="font-label-md text-label-md text-text-muted transition-colors hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("norms")}
          </Link>
        </div>
      </div>
    </section>
  );
}
