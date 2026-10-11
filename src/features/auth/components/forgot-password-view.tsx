"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
        <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
          {t("title")}{" "}
          <span className="font-headline-md text-headline-md font-normal text-secondary">
            {t("titleAlt")}
          </span>
        </h1>

        <div className="flex flex-col gap-space-sm rounded-lg border border-outline-variant bg-surface p-space-md">
          <p className="font-body-md text-body-md text-on-surface-strong">{t("bodyEn")}</p>
          <p className="font-body-sm text-body-sm text-secondary">{t("bodyEs")}</p>
        </div>

        <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-space-sm">
              <label
                className="font-label-md text-label-md font-semibold text-on-surface-strong"
                htmlFor="forgot-email"
              >
                {t("emailLabel")}
              </label>
              <span className="font-label-caps text-label-caps text-secondary uppercase">
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
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("emailPlaceholder")}
                className={cn(
                  "h-11 w-full rounded-lg border bg-surface pr-space-md pl-10 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-secondary/60 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none",
                  showEmailError ? "border-[#f87171]" : "border-outline-variant",
                )}
              />
              <Icon
                name="mail"
                className="pointer-events-none absolute top-2.5 left-3 text-[20px] text-secondary"
              />
            </div>
            {showEmailError ? (
              <span className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-[#f87171]">
                <Icon name="cancel" className="text-[16px]" />
                {t("emailError")}
              </span>
            ) : (
              <span className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                <Icon name="info" className="text-[16px]" />
                {t("emailHelper")}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex h-12 w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-primary/40 focus:outline-none disabled:opacity-70"
          >
            {submitting ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                <span>{t("submitting")}</span>
              </>
            ) : (
              <>
                <span>{t("submit")}</span>
                <Icon name="arrow_forward" className="text-[18px]" />
              </>
            )}
          </button>
        </form>

        <div className="flex flex-col gap-space-md">
          <div className="flex items-center gap-space-md">
            <span className="h-px flex-1 bg-outline-variant" />
            <span className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">
              {t("or")}
            </span>
            <span className="h-px flex-1 bg-outline-variant" />
          </div>
          <Link
            href="/login"
            className="mx-auto inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary"
          >
            <Icon name="arrow_back" className="text-[18px]" />
            {t("returnToLogin")}
          </Link>
        </div>
      </div>
    </RecoveryShell>
  );
}
