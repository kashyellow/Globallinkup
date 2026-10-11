"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

type LinkState = "valid" | "invalid";

export function ResetPasswordView() {
  const t = useTranslations("Auth.resetPassword");
  const router = useRouter();

  const [linkState, setLinkState] = useState<LinkState>("valid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const rules = {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
  const passed = Object.values(rules).filter(Boolean).length;

  const confirmValid = confirm.length > 0 && confirm === password;
  const formValid = passed === 3 && confirmValid;

  const showConfirmError = submitted && !confirmValid;

  const strengthKey =
    passed >= 3 ? "strengthStrong" : passed === 2 ? "strengthMedium" : "strengthWeak";

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    if (!formValid) return;

    setSubmitting(true);
    // No auth backend wired up yet — simulate the update, then send the user
    // back to sign in with their new password.
    // TODO(auth): supabase.auth.updateUser({ password })
    setTimeout(() => router.push("/login"), 1000);
  }

  return (
    <>
      {process.env.NODE_ENV === "development" ? (
        <div className="mx-auto flex w-full max-w-[1240px] flex-col items-start justify-between gap-space-sm px-margin-mobile pt-space-lg md:flex-row md:items-center lg:px-margin">
          <div className="flex items-center gap-space-xs text-secondary">
            <Icon name="tune" filled className="text-[18px] text-primary" />
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("previewLabel")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            {(["valid", "invalid"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLinkState(key)}
                className={cn(
                  "rounded-lg px-space-sm py-1 font-label-md text-label-md transition-all",
                  linkState === key
                    ? "bg-outline-variant font-semibold text-on-surface"
                    : "text-secondary hover:text-on-surface",
                )}
              >
                {t(`state_${key}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <RecoveryShell>
        {linkState === "invalid" ? (
          <div className="flex flex-col items-center gap-space-md py-space-xs text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger">
              <Icon name="link_off" className="text-[32px]" />
            </div>
            <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
              {t("invalidTitle")}
            </h1>
            <p className="max-w-md font-body-md text-body-md text-secondary">{t("invalidBody")}</p>
            <Link
              href="/forgot-password"
              className="inline-flex h-12 items-center justify-center gap-space-xs rounded-xl bg-primary-container px-space-lg font-label-lg text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Icon name="refresh" className="text-[18px]" />
              {t("requestNewLink")}
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
                {t("title")}{" "}
                <span className="font-headline-md text-headline-md font-normal text-secondary">
                  {t("titleAlt")}
                </span>
              </h1>
              <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
            </div>

            <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
              {/* New password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-space-sm">
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface-strong"
                    htmlFor="reset-password"
                  >
                    {t("passwordLabel")} <span className="text-primary">*</span>
                  </label>
                  <span className="font-body-sm text-body-sm text-secondary">
                    {t("passwordHint")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="reset-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="h-11 w-full rounded-lg border border-outline-variant bg-surface pr-10 pl-10 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-secondary/60 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <Icon
                    name="lock"
                    className="pointer-events-none absolute top-2.5 left-3 text-[20px] text-secondary"
                  />
                  <button
                    type="button"
                    aria-label={t("togglePassword")}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute top-2 right-2.5 rounded-lg p-1 text-secondary transition-colors hover:text-on-surface focus:outline-none"
                  >
                    <Icon
                      name={showPassword ? "visibility_off" : "visibility"}
                      className="text-[20px]"
                    />
                  </button>
                </div>

                {/* Strength meter */}
                <div className="mt-1 flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface p-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-label-caps text-secondary uppercase">
                      {t("strengthLabel")}
                    </span>
                    <span
                      className={cn(
                        "font-label-caps text-label-caps font-semibold uppercase",
                        passed >= 3 ? "text-tertiary" : "text-on-surface-strong",
                      )}
                    >
                      {t(strengthKey)}
                    </span>
                  </div>
                  <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-outline-variant">
                    {[0, 1, 2].map((index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-full w-1/3 transition-all duration-300",
                          index < passed
                            ? passed >= 3
                              ? "bg-tertiary"
                              : "bg-primary"
                            : "bg-outline-variant",
                        )}
                      />
                    ))}
                  </div>
                  <div className="grid grid-cols-1 gap-1 pt-1 font-body-sm text-body-sm text-secondary sm:grid-cols-3">
                    <Rule ok={rules.length} label={t("ruleLength")} />
                    <Rule ok={rules.case} label={t("ruleCase")} />
                    <Rule ok={rules.number} label={t("ruleNumber")} />
                  </div>
                </div>
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-1.5">
                <label
                  className="font-label-md text-label-md font-semibold text-on-surface-strong"
                  htmlFor="reset-confirm"
                >
                  {t("confirmLabel")} <span className="text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id="reset-confirm"
                    name="confirm-password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder={t("confirmPlaceholder")}
                    className={cn(
                      "h-11 w-full rounded-lg border bg-surface pr-10 pl-10 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-secondary/60 focus:border-transparent focus:ring-2 focus:ring-primary focus:outline-none",
                      showConfirmError ? "border-[#f87171]" : "border-outline-variant",
                    )}
                  />
                  <Icon
                    name="lock_reset"
                    className="pointer-events-none absolute top-2.5 left-3 text-[20px] text-secondary"
                  />
                  <button
                    type="button"
                    aria-label={t("toggleConfirm")}
                    onClick={() => setShowConfirm((value) => !value)}
                    className="absolute top-2 right-2.5 rounded-lg p-1 text-secondary transition-colors hover:text-on-surface focus:outline-none"
                  >
                    <Icon
                      name={showConfirm ? "visibility_off" : "visibility"}
                      className="text-[20px]"
                    />
                  </button>
                </div>
                {showConfirmError ? (
                  <span className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-[#f87171]">
                    <Icon name="cancel" className="text-[16px]" />
                    {t("confirmError")}
                  </span>
                ) : null}
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

            <Link
              href="/login"
              className="mx-auto inline-flex items-center gap-1.5 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary"
            >
              <Icon name="arrow_back" className="text-[18px]" />
              {t("backToLogin")}
            </Link>
          </div>
        )}
      </RecoveryShell>
    </>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon
        name={ok ? "check_circle" : "radio_button_unchecked"}
        filled={ok}
        className={cn("text-[16px]", ok ? "text-[#38a36f]" : "text-secondary")}
      />
      <span>{label}</span>
    </div>
  );
}
