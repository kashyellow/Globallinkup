"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { RecoveryShell } from "./recovery-shell";

type LinkState = "valid" | "invalid";

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const FIELD_BASE =
  "h-11 w-full rounded-full border bg-surface pr-12 pl-11 font-body-md text-body-md text-on-surface transition-colors placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2";

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
            <Icon name="tune" filled className="text-lg text-primary" />
            <span className="font-label-md text-label-md">{t("previewLabel")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            {(["valid", "invalid"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setLinkState(key)}
                className={cn(
                  "rounded-full px-space-sm py-1.5 font-label-md text-label-md transition-colors",
                  EASE,
                  linkState === key
                    ? "bg-surface-container-high font-semibold text-on-surface"
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
            <span className="flex h-16 w-16 items-center justify-center rounded-full border border-danger-border bg-danger-surface text-danger-text">
              <Icon name="link_off" className="text-3xl" />
            </span>
            <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
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
              <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
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
                    className={cn(
                      FIELD_BASE,
                      "border-outline-variant focus-visible:outline-primary",
                    )}
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
                      "absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
                      EASE,
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    )}
                  >
                    <Icon
                      name={showPassword ? "visibility_off" : "visibility"}
                      className="text-lg"
                    />
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
                      {t(strengthKey)}
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
                      "absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
                      EASE,
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    )}
                  >
                    <Icon
                      name={showConfirm ? "visibility_off" : "visibility"}
                      className="text-lg"
                    />
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

            <Link
              href="/login"
              className={cn(
                "mx-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-space-md py-2 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:text-primary",
                EASE,
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              )}
            >
              <Icon name="arrow_back" className="text-lg" />
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
        className={cn("text-base", ok ? "text-success-text" : "text-secondary")}
      />
      <span>{label}</span>
    </div>
  );
}
