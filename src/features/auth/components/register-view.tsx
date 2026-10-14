"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyc-MW9quqLnbgdJUAe2h5sHNm-RMIEthJJN7Ym4f3q1zfEVm1_DHttWU_m0EYbKkyuOOIlWtV1bi0fUA6FoBTcFQMURZJV-QwJ8WYDuxjj55Xdx5cp7T8RClqtbyxBQaosO00tgSAN2uIvO_3pMpUgidtUBYAQlbFWROZ1ZJ3ORJu_hkELvpUKhYJvKvzg-rT023jEzm7n9svQFqduY5wNIjziUoVDoOZ2dCcatpOvGn7xCNDG2LZGA";

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const FIELD_BASE =
  "w-full border bg-surface px-space-md font-body-md text-body-md text-on-surface transition-colors placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2";

export function RegisterView() {
  const t = useTranslations("Auth.register");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const rules = {
    length: password.length >= 8,
    case: /[a-z]/.test(password) && /[A-Z]/.test(password),
    number: /\d/.test(password),
  };
  const passed = Object.values(rules).filter(Boolean).length;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  const confirmValid = confirm.length > 0 && confirm === password;
  const formValid = emailValid && passed === 3 && confirmValid && terms;

  const showEmailError = submitted && !emailValid;
  const showConfirmError = submitted && !confirmValid;
  const showBanner = submitted && !formValid;

  const strengthKey =
    passed >= 3 ? "strengthStrong" : passed === 2 ? "strengthMedium" : "strengthWeak";

  function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitted(true);

    if (!formValid) return;
    // No auth backend yet — continue the onboarding flow.
    router.push("/create-persona");
  }

  return (
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-md lg:px-margin lg:py-space-xl">
      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        {/* Form column — leads on mobile so the task is the first thing shown */}
        <div className="order-1 bezel-tray lg:order-2 lg:col-span-7">
          <div
            className="flex h-full flex-col justify-center bezel-core p-space-md sm:p-space-lg lg:p-space-xl"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <div className="flex flex-col gap-space-md">
              <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-outline-variant bg-surface-container px-space-sm py-1">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary motion-reduce:animate-none" />
                <span className="font-label-md text-label-md text-on-surface">
                  {t("cardBadge")}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
                  {t("title")}{" "}
                  <span className="font-headline-sm text-headline-sm font-normal text-secondary">
                    {t("titleAlt")}
                  </span>
                </h1>
                <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
              </div>

              {/* Validation banner */}
              {showBanner ? (
                <div
                  role="alert"
                  className="flex items-start gap-space-sm rounded-2xl border border-danger-border bg-danger-surface p-space-md"
                >
                  <Icon name="error_outline" className="mt-0.5 shrink-0 text-lg text-danger-text" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-label-lg text-label-lg font-semibold text-danger-text">
                      {t("bannerTitle")}
                    </span>
                    <span className="font-body-sm text-body-sm leading-snug text-secondary">
                      {t("bannerBody")}
                    </span>
                  </div>
                </div>
              ) : null}

              <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
                {/* Email */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-space-xs">
                    <label
                      className="font-label-md text-label-md font-semibold text-on-surface"
                      htmlFor="reg-email"
                    >
                      {t("emailLabel")} <span className="text-primary">*</span>
                    </label>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      {t("emailHelper")}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="reg-email"
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
                  ) : null}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-space-xs">
                    <label
                      className="font-label-md text-label-md font-semibold text-on-surface"
                      htmlFor="reg-password"
                    >
                      {t("passwordLabel")} <span className="text-primary">*</span>
                    </label>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      {t("passwordHint")}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="reg-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className={cn(
                        FIELD_BASE,
                        "h-11 rounded-full pr-12 pl-11",
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
                        "absolute top-1/2 right-0.5 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
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
                  <div className="mt-1 flex flex-col gap-space-xs rounded-2xl border border-outline-variant bg-surface-container p-space-sm">
                    <div className="flex items-center justify-between gap-space-xs">
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
                            "h-full w-1/3 transition-colors",
                            EASE,
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
                <div className="flex flex-col gap-space-xs">
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface"
                    htmlFor="reg-confirm"
                  >
                    {t("confirmLabel")} <span className="text-primary">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="reg-confirm"
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

                {/* Terms */}
                <div className="flex items-start gap-space-sm pt-space-xs">
                  <input
                    id="reg-terms"
                    name="terms"
                    type="checkbox"
                    required
                    checked={terms}
                    onChange={(event) => setTerms(event.target.checked)}
                    className="mt-0 h-6 w-6 shrink-0 cursor-pointer rounded border-outline-variant bg-surface accent-primary"
                  />
                  <label
                    className="cursor-pointer font-body-sm text-body-sm leading-relaxed text-secondary select-none"
                    htmlFor="reg-terms"
                  >
                    {t.rich("terms", {
                      // Terms now has a real route (`/[locale]/terms`); the
                      // Privacy Policy does not exist yet, so that chunk stays
                      // styled text rather than a dead `href="#"` anchor.
                      terms: (chunks) => (
                        <Link
                          href="/terms"
                          className="font-semibold text-on-surface underline decoration-primary/50 underline-offset-2 transition-colors hover:text-primary"
                        >
                          {chunks}
                        </Link>
                      ),
                      privacy: (chunks) => (
                        <span className="font-semibold text-on-surface underline decoration-primary/50 underline-offset-2">
                          {chunks}
                        </span>
                      ),
                    })}
                  </label>
                </div>

                <div className="flex flex-col gap-space-sm pt-space-xs">
                  <button
                    type="submit"
                    className={cn(
                      "flex min-h-12 w-full items-center justify-center gap-space-xs rounded-full bg-primary px-space-md text-center font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover",
                      EASE,
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                    )}
                  >
                    <span>{t("submit")}</span>
                    <Icon name="arrow_forward" className="text-lg" />
                  </button>
                  <div className="pt-space-xs text-center">
                    <p className="font-body-sm text-body-sm text-secondary">
                      {t("haveAccount")}{" "}
                      <Link
                        href="/login"
                        className="ml-1 inline-flex min-h-11 items-center font-label-lg text-label-lg font-semibold whitespace-nowrap text-primary transition-colors hover:text-primary-hover"
                      >
                        {t("logIn")}
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Editorial storytelling column — below the form on mobile */}
        <div className="order-2 bezel-tray lg:order-1 lg:col-span-5">
          <div
            className="flex h-full flex-col justify-between gap-space-lg bezel-core p-space-md lg:p-space-xl"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <div className="relative z-10 flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md font-semibold text-primary">
                  {t("stepperLabel")}
                </span>
                <div className="flex flex-wrap items-center gap-space-xs font-label-md text-label-md">
                  <span className="font-semibold text-primary">{t("step1")}</span>
                  <span aria-hidden="true" className="text-secondary">
                    &rarr;
                  </span>
                  <span className="text-secondary">{t("step2")}</span>
                  <span aria-hidden="true" className="text-secondary">
                    &rarr;
                  </span>
                  <span className="text-secondary">{t("step3")}</span>
                </div>
              </div>

              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("photoAlt")}
                  className="h-full w-full object-cover"
                  src={PHOTO}
                  loading="lazy"
                />
                {/* The badge rides the top edge, clear of the subjects; the caption
                    sits on a full-width scrim at the bottom. Overlaying both on the
                    lower third put the label on top of the people in the photo. */}
                <span className="absolute top-space-sm left-space-sm inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest/90 px-space-sm py-1 font-label-md text-label-md font-semibold text-primary">
                  <Icon name="verified" filled className="text-sm" />
                  {t("photoBadge")}
                </span>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/92 to-transparent px-space-md pt-space-xl pb-space-md">
                  <p className="font-body-sm text-body-sm leading-snug text-on-surface">
                    {t("photoCaption")}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <h2 className="font-headline-md text-headline-md leading-snug font-semibold text-on-surface">
                  {t("quoteTitle")}
                </h2>
                <p className="font-body-md text-body-md leading-relaxed text-secondary">
                  {t("quoteBody")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-space-sm rounded-full border border-outline-variant bg-surface-container p-space-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success-surface">
                <Icon name="verified_user" className="text-lg text-success-text" />
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="font-label-lg text-label-lg leading-tight text-on-surface">
                  {t("privacyTitle")}
                </span>
                <span className="font-body-sm text-body-sm text-secondary">{t("privacyBody")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
