"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PHOTO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCyc-MW9quqLnbgdJUAe2h5sHNm-RMIEthJJN7Ym4f3q1zfEVm1_DHttWU_m0EYbKkyuOOIlWtV1bi0fUA6FoBTcFQMURZJV-QwJ8WYDuxjj55Xdx5cp7T8RClqtbyxBQaosO00tgSAN2uIvO_3pMpUgidtUBYAQlbFWROZ1ZJ3ORJu_hkELvpUKhYJvKvzg-rT023jEzm7n9svQFqduY5wNIjziUoVDoOZ2dCcatpOvGn7xCNDG2LZGA";

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
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-md lg:px-margin lg:py-space-xl">
      <div className="grid grid-cols-1 items-stretch gap-space-lg lg:grid-cols-12 lg:gap-space-xl">
        {/* Editorial storytelling column */}
        <section className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant bg-surface-container p-space-md lg:col-span-5 lg:p-space-xl">
          <div className="relative z-10 flex flex-col gap-space-lg">
            <div className="flex flex-col gap-space-xs">
              <span className="font-label-caps text-label-caps tracking-widest text-primary uppercase">
                {t("stepperLabel")}
              </span>
              <div className="flex items-center gap-space-xs font-label-md text-label-md">
                <span className="font-semibold text-primary">{t("step1")}</span>
                <span className="text-secondary">→</span>
                <span className="text-secondary">{t("step2")}</span>
                <span className="text-secondary">→</span>
                <span className="text-secondary">{t("step3")}</span>
              </div>
            </div>

            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-low shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={t("photoAlt")}
                className="h-full w-full object-cover"
                src={PHOTO}
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0B0A09]/95 via-[#0B0A09]/60 to-transparent p-space-md text-on-surface">
                <p className="mb-0.5 font-label-caps text-label-caps tracking-wider text-primary uppercase">
                  {t("photoBadge")}
                </p>
                <p className="font-body-sm text-body-sm leading-snug text-on-surface-strong">
                  {t("photoCaption")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs">
              <h2 className="font-headline-md text-headline-md leading-snug font-semibold tracking-tight text-on-surface">
                {t("quoteTitle")}
              </h2>
              <p className="font-body-md text-body-md leading-relaxed text-secondary">
                {t("quoteBody")}
              </p>
            </div>
          </div>

          <div className="mt-space-lg flex items-center gap-space-sm rounded-lg border border-outline-variant bg-surface-low/90 p-space-sm backdrop-blur-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#183928]">
              <Icon name="verified_user" className="text-[20px] text-success-text" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-lg text-label-lg leading-tight text-on-surface">
                {t("privacyTitle")}
              </span>
              <span className="font-body-sm text-body-sm text-secondary">{t("privacyBody")}</span>
            </div>
          </div>
        </section>

        {/* Form column */}
        <section className="flex flex-col justify-center lg:col-span-7">
          <div className="flex flex-col gap-space-md rounded-2xl border border-outline-variant bg-surface-low p-space-md shadow-lg sm:p-space-lg lg:p-space-xl">
            <div className="flex flex-col gap-space-xs pb-space-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="inline-flex items-center gap-1.5 self-start rounded-lg border border-[#3D3934] bg-[#2A2523] px-space-sm py-1 font-label-caps text-label-caps text-on-surface-strong uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                {t("cardBadge")}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
                {t("title")}{" "}
                <span className="font-headline-md text-headline-md font-normal text-secondary">
                  {t("titleAlt")}
                </span>
              </h1>
              <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
            </div>

            {/* Validation banner */}
            {showBanner ? (
              <div className="flex items-start gap-space-sm rounded-xl border border-[#f87171]/40 bg-danger-surface p-space-md text-danger-text">
                <Icon name="error_outline" className="mt-0.5 shrink-0 text-[20px] text-[#f87171]" />
                <div className="flex flex-col gap-0.5">
                  <span className="font-label-lg text-label-lg font-semibold text-[#f87171]">
                    {t("bannerTitle")}
                  </span>
                  <span className="font-body-sm text-body-sm leading-snug text-danger-text/90">
                    {t("bannerBody")}
                  </span>
                </div>
              </div>
            ) : null}

            <form className="flex flex-col gap-space-md pt-space-xs" onSubmit={submit} noValidate>
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface-strong"
                    htmlFor="reg-email"
                  >
                    {t("emailLabel")} <span className="text-primary">*</span>
                  </label>
                  <span className="font-body-sm text-body-sm text-secondary">
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
                ) : null}
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <label
                    className="font-label-md text-label-md font-semibold text-on-surface-strong"
                    htmlFor="reg-password"
                  >
                    {t("passwordLabel")} <span className="text-primary">*</span>
                  </label>
                  <span className="font-body-sm text-body-sm text-secondary">
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

              {/* Terms */}
              <div className="flex items-start gap-space-sm pt-space-xs">
                <input
                  id="reg-terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={terms}
                  onChange={(event) => setTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface accent-[#E86A5B]"
                />
                <label
                  className="cursor-pointer font-body-sm text-body-sm leading-relaxed text-secondary select-none"
                  htmlFor="reg-terms"
                >
                  {t.rich("terms", {
                    terms: (chunks) => (
                      <a href="#" className="font-semibold text-primary hover:underline">
                        {chunks}
                      </a>
                    ),
                    privacy: (chunks) => (
                      <a href="#" className="font-semibold text-primary hover:underline">
                        {chunks}
                      </a>
                    ),
                  })}
                </label>
              </div>

              <div className="flex flex-col gap-space-sm pt-space-xs">
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-space-xs rounded-xl bg-primary-container font-label-lg text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover focus:ring-2 focus:ring-primary/40 focus:outline-none"
                >
                  <span>{t("submit")}</span>
                  <Icon name="arrow_forward" className="text-[18px]" />
                </button>
                <div className="pt-space-xs text-center">
                  <p className="font-body-sm text-body-sm text-secondary">
                    {t("haveAccount")}{" "}
                    <Link
                      href="/login"
                      className="ml-1 font-label-lg text-label-lg font-semibold text-primary hover:underline"
                    >
                      {t("logIn")}
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
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
