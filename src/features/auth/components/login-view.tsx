"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type LoginState = "ready" | "invalid" | "pending" | "loading";

const BACKDROP =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDGFyRgMDJc7aMfkwNEAgsrQK8vHotU1xDnVagJ6BFOfsajrn2yfQNXQrZwKTdQZ9zPIbmYz5FX7p8umTc5IcBOl3dVLtcBSpM3w0PDKhrmdcJJBQBy7K3tv0WEvSEXQ_dBAQFg_MIY1Q0cAvgnm9LPSEnWBmF_HrZAKLMoKm6kilYIe89uUloN94Fv9ISOufwUw0geNbllEDbKn2F1dHRewxCS-48cqTadhQHAITrepAtvznXLQaG2-g";

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
    <section className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-md lg:px-margin lg:py-space-xl">
      {process.env.NODE_ENV === "development" ? (
        <div className="mb-space-lg flex w-full flex-col items-start justify-between gap-space-sm rounded-xl border border-outline-variant bg-surface-low p-space-sm shadow-sm md:flex-row md:items-center">
          <div className="flex items-center gap-space-xs text-secondary">
            <Icon name="tune" className="text-[18px] text-primary" />
            <span className="font-label-caps text-label-caps tracking-wider uppercase">
              {t("previewLabel")}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-space-xs">
            {(["ready", "invalid", "pending", "loading"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setState(key)}
                className={cn(
                  "rounded-lg px-space-sm py-1 font-label-md text-label-md transition-all",
                  state === key
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

      <div className="grid grid-cols-1 items-stretch gap-gutter lg:grid-cols-12">
        {/* Editorial brand panel */}
        <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-xl border border-outline-variant bg-surface-low p-space-lg lg:col-span-6 lg:min-h-[640px] lg:p-space-xl">
          <div className="absolute inset-0 z-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={t("backdropAlt")}
              className="h-full w-full object-cover object-center brightness-[0.80] contrast-[1.05]"
              src={BACKDROP}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0B0A09]/95 via-[#0B0A09]/60 to-transparent" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-low/85 px-space-sm py-1 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[#38a36f]" />
              <span className="font-label-caps text-label-caps tracking-wider text-on-surface uppercase">
                {t("badgeEdition")}
              </span>
            </div>
            <span className="hidden font-label-caps text-label-caps tracking-widest text-on-surface-strong/70 uppercase sm:inline-block">
              {t("badgeMeta")}
            </span>
          </div>

          <div className="relative z-10 flex flex-col gap-space-md pt-space-xl text-on-surface">
            <div className="inline-flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-admin-text">
                {t("welcomeEs")}
              </span>
              <span className="font-body-sm text-secondary">{t("welcomeEn")}</span>
            </div>
            <blockquote className="font-headline-md text-headline-md leading-relaxed font-medium tracking-tight text-on-surface">
              {t("quote")}
            </blockquote>
            <div className="flex items-center gap-space-md pt-space-xs font-body-sm text-body-sm text-on-surface-strong">
              <div className="flex items-center gap-1">
                <Icon name="verified_user" className="text-[16px] text-success-text" />
                <span>{t("peerVerified")}</span>
              </div>
              <span className="text-secondary">•</span>
              <div className="flex items-center gap-1">
                <Icon name="translate" className="text-[16px] text-admin-text" />
                <span>{t("bilingualNarrative")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auth card */}
        <div className="flex flex-col justify-center lg:col-span-6">
          <div className="flex flex-col gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-lg lg:p-space-xl">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-baseline justify-between">
                <h1 className="font-headline-lg text-headline-lg-mobile font-semibold tracking-tight text-on-surface md:text-headline-lg">
                  {t("title")}
                </h1>
                <span className="font-label-caps text-label-caps text-secondary uppercase">
                  {t("titleAlt")}
                </span>
              </div>
              <p className="font-body-md text-body-md text-secondary">{t("subtitle")}</p>
            </div>

            {/* Invalid credentials */}
            {isInvalid ? (
              <div className="rounded-lg border border-[#ff6b6b]/30 bg-[#3d1411] p-space-md text-on-error-container transition-all">
                <div className="flex items-start gap-space-sm">
                  <Icon name="error_outline" className="mt-0.5 text-[20px] text-[#ff6b6b]" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-admin-text">
                      {t("invalidTitle")}
                    </span>
                    <p className="mt-0.5 font-body-sm text-body-sm text-on-surface-strong">
                      {t("invalidBody")}{" "}
                      <a
                        href="#"
                        className="font-medium text-admin-text underline hover:text-white"
                      >
                        {t("resetPassword")}
                      </a>
                      .
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Pending review */}
            {state === "pending" ? (
              <div className="rounded-lg border border-outline-variant bg-[#22201d] p-space-md text-on-surface-strong transition-all">
                <div className="flex items-start gap-space-sm">
                  <Icon name="pending_actions" className="mt-0.5 text-[20px] text-secondary" />
                  <div className="flex flex-col">
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                      {t("pendingTitle")}
                    </span>
                    <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                      {t("pendingBody")}{" "}
                      <Link
                        href="/verify"
                        className="inline-flex items-center gap-0.5 font-medium text-primary underline"
                      >
                        {t("viewStatus")}
                        <Icon name="arrow_forward" className="text-[14px]" />
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <form className="flex flex-col gap-space-md" onSubmit={submit}>
              {/* Email */}
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-md text-label-md text-on-surface"
                    htmlFor="login-email"
                  >
                    {t("emailLabel")}
                  </label>
                  <span className="font-label-caps text-label-caps text-secondary">
                    {t("emailHelper")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("emailPlaceholder")}
                    className={cn(
                      "w-full rounded-lg border bg-surface px-space-md py-3 font-body-md text-body-md text-on-surface transition-all placeholder:text-secondary/60 focus:outline-none",
                      isInvalid
                        ? "border-[#ff6b6b] shadow-[0_0_0_2px_#ff6b6b]"
                        : "border-outline-variant shadow-[0_0_0_2px_#E86A5B]",
                    )}
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-space-md text-secondary">
                    <Icon name="alternate_email" className="text-[20px]" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label
                    className="font-label-md text-label-md text-on-surface"
                    htmlFor="login-password"
                  >
                    {t("passwordLabel")}
                  </label>
                  <a
                    href="#"
                    className="font-label-md text-label-md text-primary transition-all hover:underline"
                  >
                    {t("forgotPassword")}
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-lg border border-outline-variant bg-surface px-space-md py-3 pr-12 font-body-md text-body-md text-on-surface transition-all focus:border-primary focus:outline-none"
                  />
                  <button
                    type="button"
                    aria-label={t("togglePassword")}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex items-center pr-space-md text-secondary transition-colors hover:text-on-surface"
                  >
                    <Icon
                      name={showPassword ? "visibility_off" : "visibility"}
                      className="text-[20px]"
                    />
                  </button>
                </div>
              </div>

              {/* Remember device */}
              <div className="flex items-center justify-between pt-space-xs">
                <label className="flex cursor-pointer items-center gap-space-sm select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface accent-[#E86A5B]"
                  />
                  <span className="font-body-sm text-body-sm text-on-surface-strong">
                    {t("remember")}
                  </span>
                </label>
                <div className="hidden items-center gap-1 text-secondary sm:flex">
                  <Icon name="lock" className="text-[16px]" />
                  <span className="font-label-caps text-label-caps">TLS 1.3</span>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-space-xs">
                <button
                  type="submit"
                  disabled={state === "loading"}
                  className="flex min-h-[46px] w-full items-center justify-center gap-space-sm rounded-lg bg-primary-container px-space-lg py-3 font-label-lg text-label-lg font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-primary-hover"
                >
                  {state === "loading" ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white" />
                      <span>{t("submitting")}</span>
                    </>
                  ) : (
                    <span>{t("submit")}</span>
                  )}
                </button>
              </div>
            </form>

            <div className="flex flex-col gap-space-xs pt-space-sm text-center">
              <p className="font-body-md text-body-md text-secondary">
                {t("noAccount")}{" "}
                <Link href="/register" className="ml-1 font-semibold text-primary hover:underline">
                  {t("createAccount")}
                </Link>
              </p>
              <p className="font-body-sm text-body-sm text-secondary">
                {t("noAccountEs")}{" "}
                <Link
                  href="/register"
                  className="ml-1 font-medium text-on-surface hover:text-primary"
                >
                  {t("registerFree")}
                </Link>
              </p>
            </div>

            <div className="mt-space-xs flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-space-sm">
              <div className="flex items-center gap-space-xs text-secondary">
                <Icon name="shield" className="text-[16px] text-[#38a36f]" />
                <span className="font-body-sm text-body-sm text-on-surface-strong">
                  {t("trackers")}
                </span>
              </div>
              <a href="#" className="font-label-caps text-label-caps text-primary hover:underline">
                {t("policies")}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
