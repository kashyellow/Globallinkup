"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { updatePasswordAction, type AuthError } from "@/features/auth/actions";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

type LinkState = "valid" | "invalid";

const ERROR_KEYS: Record<AuthError, string> = {
  emailInUse: "errorGeneric",
  weakPassword: "errorWeakPassword",
  rateLimited: "errorRateLimited",
  confirmEmail: "errorGeneric",
  invalid: "errorGeneric",
  unknown: "errorGeneric",
};

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const FIELD_BASE =
  "h-11 w-full rounded-full border bg-surface pr-12 pl-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2";

export function ResetPasswordView({ hasRecoverySession }: { hasRecoverySession: boolean }) {
  const t = useTranslations("Auth.resetPassword");
  const router = useRouter();

  const linkState: LinkState = hasRecoverySession ? "valid" : "invalid";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<AuthError | null>(null);

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

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);
    setServerError(null);
    if (!formValid || submitting) return;

    setSubmitting(true);
    try {
      const result = await updatePasswordAction({ password, confirm });
      if (!result.ok) {
        setServerError(result.error);
        setSubmitting(false);
        return;
      }

      router.push(result.redirectTo);
    } catch {
      setServerError("unknown");
      setSubmitting(false);
    }
  }

  return (
    <RecoveryShell back={{ href: "/login", label: t("backToLogin") }}>
      {linkState === "invalid" ? (
        <div className="flex flex-col items-center gap-space-md py-space-xs text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
            <Icon name="link_off" className="text-3xl" />
          </span>
          <h1 className="font-title text-title-mobile text-on-surface md:text-title">
            {t("invalidTitle")}
          </h1>
          <p className="max-w-md font-body-md text-body-md text-secondary">{t("invalidBody")}</p>
          <Link
            href="/forgot-password"
            className={cn(
              "inline-flex h-12 items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg font-label-lg text-label-lg font-semibold text-on-primary transition-colors",
              EASE,
              "hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
            )}
          >
            <Icon name="refresh" className="text-lg" />
            {t("requestNewLink")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <h1 className="font-title text-title-mobile text-on-surface md:text-title">
              {t("title")}
            </h1>
            <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
          </div>

          <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
            {/* New password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-space-sm">
                <label
                  className="font-label-md text-label-md font-semibold text-on-surface"
                  htmlFor="reset-password"
                >
                  {t("passwordLabel")} <span className="text-primary">*</span>
                </label>
                <span className="font-body-sm text-body-sm text-text-muted">
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
                  aria-invalid={showConfirmError || undefined}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  className={cn(FIELD_BASE, "border-outline-variant focus-visible:outline-primary")}
                />
                <Icon
                  name="lock"
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-secondary"
                />
                <button
                  type="button"
                  aria-label={t("togglePassword")}
                  onClick={() => setShowPassword((value) => !value)}
                  className={cn(
                    "absolute top-1/2 right-0.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
                    EASE,
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-lg" />
                </button>
              </div>

              {/* Strength meter */}
              <div className="mt-1 flex flex-col gap-2 rounded-2xl border border-outline-variant bg-surface p-space-sm">
                <div className="flex items-center justify-between gap-space-sm">
                  <span className="font-label-md text-label-md text-secondary">
                    {t("strengthLabel")}
                  </span>
                  <span
                    className={cn(
                      "font-label-md text-label-md font-semibold",
                      passed >= 3 ? "text-success-text" : "text-on-surface",
                    )}
                  >
                    {password.length === 0 ? "—" : t(strengthKey)}
                  </span>
                </div>
                <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-outline-variant">
                  {[0, 1, 2].map((index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-full w-1/3 transition-colors duration-300",
                        index < passed
                          ? passed >= 3
                            ? "bg-success-ring"
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
                className="font-label-md text-label-md font-semibold text-on-surface"
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
                  aria-invalid={showConfirmError || undefined}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  placeholder={t("confirmPlaceholder")}
                  className={cn(
                    FIELD_BASE,
                    "h-11 rounded-full pr-12 pl-11",
                    showConfirmError
                      ? "border-danger-border-strong focus-visible:outline-danger-border-strong"
                      : "border-outline-variant focus-visible:outline-primary",
                  )}
                />
                <Icon
                  name="lock_reset"
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-secondary"
                />
                <button
                  type="button"
                  aria-label={t("toggleConfirm")}
                  onClick={() => setShowConfirm((value) => !value)}
                  className={cn(
                    "absolute top-1/2 right-0.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
                    EASE,
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  )}
                >
                  <Icon name={showConfirm ? "visibility_off" : "visibility"} className="text-lg" />
                </button>
              </div>
              {showConfirmError ? (
                <span
                  role="alert"
                  className="mt-0.5 flex items-center gap-1 font-body-sm text-body-sm text-danger-text"
                >
                  <Icon name="cancel" className="text-base" />
                  {t("confirmError")}
                </span>
              ) : null}
            </div>

            {serverError ? (
              <div
                role="alert"
                className="flex items-start gap-space-sm rounded-2xl border border-danger-border bg-danger-surface p-space-md"
              >
                <Icon name="error_outline" className="mt-0.5 shrink-0 text-lg text-danger-text" />
                <span className="font-body-sm text-body-sm text-danger-text">
                  {t(ERROR_KEYS[serverError])}
                </span>
              </div>
            ) : null}

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
        </div>
      )}
    </RecoveryShell>
  );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon
        name={ok ? "check_circle" : "radio_button_unchecked"}
        filled={ok}
        className={cn("text-base", ok ? "text-success-text" : "text-secondary")}
      />
      <span>{label}</span>
    </div>
  );
}
