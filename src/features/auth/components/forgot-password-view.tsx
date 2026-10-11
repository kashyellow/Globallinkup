"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const FIELD_BASE =
  "w-full border bg-surface px-space-md font-body-md text-body-md text-on-surface transition-colors placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2";

export function ForgotPasswordView() {
  const t = useTranslations("Auth.forgotPassword");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_PATTERN.test(email);
  const showEmailError = submitted && !emailValid;

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!emailValid) return;

    setSubmitting(true);
    // No auth backend wired up yet — simulate the request and move to the
    // confirmation step without ever putting the address in the URL.
    // TODO(auth): supabase.auth.resetPasswordForEmail(email, { redirectTo })
    setTimeout(() => router.push("/forgot-password/sent"), 900);
  }

  return (
    <RecoveryShell step={1}>
      <div className="flex flex-col gap-space-lg">
        <div className="flex flex-col gap-space-xs">
          <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
            {t("title")}{" "}
            <span className="font-headline-md text-headline-md font-normal text-secondary">
              {t("titleAlt")}
            </span>
          </h1>
        </div>

        <div className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md">
          <p className="font-body-md text-body-md text-on-surface">{t("bodyEn")}</p>
          <p className="font-body-sm text-body-sm text-secondary">{t("bodyEs")}</p>
        </div>

        <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-space-sm">
              <label
                className="font-label-md text-label-md font-semibold text-on-surface"
                htmlFor="forgot-email"
              >
                {t("emailLabel")}
              </label>
              <span className="font-body-sm text-body-sm text-text-muted">
                {t("emailRequired")}
              </span>
            </div>
            <div className="relative">
              <input
                id="forgot-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                aria-invalid={showEmailError || undefined}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                className={cn(
                  FIELD_BASE,
                  "h-11 rounded-full pr-space-md pl-11",
                  showEmailError
                    ? "border-danger-border-strong focus-visible:outline-danger-border-strong"
                    : "border-outline-variant focus-visible:outline-primary",
                )}
              />
              <Icon
                name="mail"
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-secondary"
              />
            </div>
            {showEmailError ? (
              <span
                role="alert"
                className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-danger-text"
              >
                <Icon name="cancel" className="text-base" />
                {t("emailError")}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                <Icon name="info" className="text-base" />
                {t("emailHelper")}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "flex h-12 w-full items-center justify-center gap-space-xs rounded-full bg-primary font-label-lg text-label-lg font-semibold text-on-primary transition-colors",
              EASE,
              "hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:pointer-events-none disabled:opacity-70",
            )}
          >
            {submitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/25 border-t-on-primary motion-reduce:animate-none" />
                <span>{t("submitting")}</span>
              </>
            ) : (
              <>
                <span>{t("submit")}</span>
                <Icon name="arrow_forward" className="text-lg" />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-md">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-md text-label-md text-text-muted">{t("or")}</span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>
          <Link
            href="/login"
            className={cn(
              "mx-auto inline-flex items-center gap-1.5 rounded-full px-space-md py-2 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary",
              EASE,
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
            )}
          >
            <Icon name="arrow_back" className="text-lg" />
            {t("returnToLogin")}
          </Link>
        </div>
      </div>
    </RecoveryShell>
  );
}
