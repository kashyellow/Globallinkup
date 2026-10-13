"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type LoginState = "ready" | "invalid" | "pending" | "loading";

const BACKDROP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDGFyRgMDJc7aMfkwNEAgsrQK8vHotU1xDnVagJ6BFOfsajrn2yfQNXQrZwKTdQZ9zPIbmYz5FX7p8umTc5IcBOl3dVLtcBSpM3w0PDKhrmdcJJBQBy7K3tv0WEvSEXQ_dBAQFg_MIY1Q0cAvgnm9LPSEnWBmF_HrZAKLMoKm6kilYIe89uUloN94Fv9ISOufwUw0geNbllEDbKn2F1dHRewxCS-48cqTadhQHAITrepAtvznXLQaG2-g";

const EASE = "duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]";

const FIELD_BASE =
  "w-full border bg-surface px-space-md py-3 font-body-md text-body-md text-on-surface transition-colors placeholder:text-placeholder focus-visible:outline-2 focus-visible:outline-offset-2";

export function LoginView() {
  const t = useTranslations("Auth.login");
  const router = useRouter();
  const [state, setState] = useState<LoginState>("ready");
  const [email, setEmail] = useState("sofia.martinez@example.com");
  const [password, setPassword] = useState("CuratedTrust2024");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  function submit(event: FormEvent) {
    event.preventDefault();

    if (!email.includes("@") || password.length < 8) {
      setState("invalid");
      return;
    }

    setState("loading");
    // No auth backend wired up yet — simulate a successful sign-in and enter the app.
    setTimeout(() => router.push("/discover"), 1200);
  }

  const isInvalid = state === "invalid";

  return (
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-space-md pb-page-mobile lg:px-margin lg:pt-space-xl lg:pb-page">
      {process.env.NODE_ENV === "development" ? (
        <div className="mb-space-lg flex w-full flex-col items-start justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-sm md:flex-row md:items-center">
          <div className="flex items-center gap-space-xs text-secondary">
            <Icon name="tune" className="text-lg text-primary" />
            <span className="font-label-md text-label-md">{t("previewLabel")}</span>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            {(["ready", "invalid", "pending", "loading"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setState(key)}
                className={cn(
                  "rounded-full px-space-sm py-1.5 font-label-md text-label-md transition-colors",
                  EASE,
                  state === key
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

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        {/* Editorial brand panel — below the form on mobile */}
        <div className="order-2 bezel-tray lg:order-1 lg:col-span-6">
          <div
            className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bezel-core p-space-lg lg:min-h-[640px] lg:p-space-xl"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <div className="absolute inset-0 z-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={t("backdropAlt")}
                className="h-full w-full object-cover object-center brightness-[0.80] contrast-[1.05]"
                src={BACKDROP}
              />
              {/* Strong enough to hold contrast under the blockquote at the
                  bottom of the panel — `via-background/60` let the photo
                  through and muddied the type. */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="inline-flex items-center gap-space-xs rounded-full border border-outline-variant bg-surface-low/85 px-space-sm py-1">
                <span className="h-2 w-2 rounded-full bg-success-ring" />
                <span className="font-label-md text-label-md text-on-surface">
                  {t("badgeEdition")}
                </span>
              </div>
              <span className="hidden font-label-md text-label-md text-secondary sm:inline-block">
                {t("badgeMeta")}
              </span>
            </div>

            <div className="relative z-10 flex flex-col gap-space-md pt-space-xl text-on-surface">
              <div className="inline-flex flex-wrap items-baseline gap-x-space-xs">
                <span className="font-headline-sm text-headline-sm font-semibold text-admin-text">
                  {t("welcomeEs")}
                </span>
                <span className="font-body-sm text-body-sm text-secondary">{t("welcomeEn")}</span>
              </div>
              <blockquote className="font-headline-md text-headline-md leading-relaxed font-medium text-on-surface">
                {t("quote")}
              </blockquote>
              <div className="flex flex-wrap items-center gap-x-space-md gap-y-2 pt-space-xs font-body-sm text-body-sm text-secondary">
                <span className="flex items-center gap-1.5">
                  <Icon name="verified_user" className="text-base text-success-text" />
                  {t("peerVerified")}
                </span>
                <span className="text-outline-variant">•</span>
                <span className="flex items-center gap-1.5">
                  <Icon name="translate" className="text-base text-admin-text" />
                  {t("bilingualNarrative")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth card — leads on mobile */}
        <div className="order-1 bezel-tray lg:order-2 lg:col-span-6">
          <div
            className="flex h-full flex-col justify-center bezel-core p-space-lg lg:p-space-xl"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <div className="flex flex-col gap-space-lg">
              <div className="flex flex-col gap-space-xs">
                <h1 className="font-display-md text-display-md-mobile text-on-surface md:text-display-md">
                  {t("title")}
                </h1>
                <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
              </div>

              {/* Invalid credentials */}
              {isInvalid ? (
                <div
                  role="alert"
                  className="flex items-start gap-space-sm rounded-2xl border border-danger-border bg-danger-surface p-space-md"
                >
                  <Icon name="error_outline" className="mt-0.5 shrink-0 text-lg text-danger-text" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-danger-text">
                      {t("invalidTitle")}
                    </span>
                    <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                      {t("invalidBody")}{" "}
                      <Link
                        href="/forgot-password"
                        className="font-medium text-danger-text underline transition-colors hover:text-on-surface"
                      >
                        {t("resetPassword")}
                      </Link>
                      .
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Pending review */}
              {state === "pending" ? (
                <div className="flex items-start gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md">
                  <Icon name="pending_actions" className="mt-0.5 shrink-0 text-lg text-secondary" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                      {t("pendingTitle")}
                    </span>
                    <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                      {t("pendingBody")}{" "}
                      <Link
                        href="/verify"
                        className="inline-flex items-center gap-0.5 font-medium text-primary underline transition-colors hover:text-primary-hover"
                      >
                        {t("viewStatus")}
                        <Icon name="arrow_forward" className="text-sm" />
                      </Link>
                    </p>
                  </div>
                </div>
              ) : null}

              {/* `noValidate` hands validation to the in-app error banner. Without
                  it the browser's own email check blocks submit on a malformed
                  address and the designed banner is unreachable. */}
              <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
                {/* Email */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-space-sm gap-y-1">
                    <label
                      className="font-label-md text-label-md font-semibold text-on-surface"
                      htmlFor="login-email"
                    >
                      {t("emailLabel")}
                    </label>
                    <span className="font-body-sm text-body-sm text-text-muted">
                      {t("emailHelper")}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      required
                      aria-invalid={isInvalid || undefined}
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className={cn(
                        FIELD_BASE,
                        "rounded-full pr-12",
                        isInvalid
                          ? "border-danger-border-strong focus-visible:outline-danger-border-strong"
                          : "border-outline-variant focus-visible:outline-primary",
                      )}
                    />
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-space-md text-secondary">
                      <Icon name="alternate_email" className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-space-xs">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-space-sm gap-y-1">
                    <label
                      className="font-label-md text-label-md font-semibold text-on-surface"
                      htmlFor="login-password"
                    >
                      {t("passwordLabel")}
                    </label>
                    <Link
                      href="/forgot-password"
                      className="inline-flex min-h-11 items-center font-label-md text-label-md text-primary transition-colors hover:underline"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      aria-invalid={isInvalid || undefined}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className={cn(
                        FIELD_BASE,
                        "rounded-full border-outline-variant pr-12 focus-visible:outline-primary",
                      )}
                    />
                    <button
                      type="button"
                      aria-label={t("togglePassword")}
                      onClick={() => setShowPassword((value) => !value)}
                      className={cn(
                        "absolute inset-y-0 right-0 my-auto mr-1 flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface",
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
                </div>

                {/* Remember device */}
                <div className="flex items-center justify-between gap-space-sm pt-space-xs">
                  <label className="flex cursor-pointer items-center gap-space-sm select-none">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => setRemember(event.target.checked)}
                      className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface accent-primary"
                    />
                    <span className="font-body-sm text-body-sm text-secondary">
                      {t("remember")}
                    </span>
                  </label>
                  <span className="hidden items-center gap-1 text-text-muted sm:flex">
                    <Icon name="lock" className="text-base" />
                    <span className="font-label-md text-label-md">TLS 1.3</span>
                  </span>
                </div>

                {/* Submit */}
                <div className="pt-space-xs">
                  <button
                    type="submit"
                    disabled={state === "loading"}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-lg py-3 font-label-lg text-label-lg font-semibold text-on-primary transition-colors",
                      EASE,
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:pointer-events-none disabled:opacity-70",
                    )}
                  >
                    {state === "loading" ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-on-primary/25 border-t-on-primary motion-reduce:animate-none" />
                        <span>{t("submitting")}</span>
                      </>
                    ) : (
                      <span>{t("submit")}</span>
                    )}
                  </button>
                </div>
              </form>

              <div className="flex flex-col gap-space-xs text-center">
                <p className="font-body-md text-body-md text-secondary">
                  {t("noAccount")}{" "}
                  <Link
                    href="/register"
                    className="font-semibold text-primary transition-colors hover:underline"
                  >
                    {t("createAccount")}
                  </Link>
                </p>
                <p className="font-body-sm text-body-sm text-text-muted">
                  {t("noAccountEs")}{" "}
                  <Link
                    href="/register"
                    className="font-medium text-secondary transition-colors hover:text-primary"
                  >
                    {t("registerFree")}
                  </Link>
                </p>
              </div>

              <div className="flex items-center justify-between gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-sm">
                <span className="flex items-center gap-space-xs text-secondary">
                  <Icon name="shield" className="text-base text-success-text" />
                  <span className="font-body-sm text-body-sm">{t("trackers")}</span>
                </span>
                <span className="shrink-0 font-label-md text-label-md text-text-muted">
                  {t("policies")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
