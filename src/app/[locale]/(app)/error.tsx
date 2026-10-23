"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";

/**
 * Route-level error boundary for the signed-in shell. Keeps the navbar and
 * footer mounted and gives the user a retry instead of a blank screen.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center gap-space-md px-margin-mobile py-page-mobile text-center md:px-margin md:py-page">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
        <Icon name="error_outline" className="text-2xl" />
      </span>
      <h1 className="font-headline-lg text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
        {t("retryTitle")}
      </h1>
      <p className="max-w-[46ch] font-body-md text-body-md text-secondary">{t("retryBody")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-space-xs inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-space-lg font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <Icon name="refresh" className="text-lg" />
        {t("retry")}
      </button>
    </div>
  );
}
