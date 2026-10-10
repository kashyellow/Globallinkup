"use client";

import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PLATE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuADliJdt0rmbdwabBjgct3MroNhyQGQEpEC04Vx2tdDaLu_Nyalx2vdJwT8nQa-xxiAPl5RzZQjU0HP0f5rqVa3QHq9W9iKw8lBlBXx72GNW8wEGXNiW_QnM3N40HLTY-Yrw3IQybTm93jx5MI7BwCagcgMO1JGmF5_ZQz7XF5bHx-yTKYryVgB7wV5pWu3K_REoY2TghfH75ciuZSJAVzxBHJhI4uV_0BZgrtReC3Y-Bt9CaS0LaYjqA";
const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCMXczYpS-catSoQN-hNs5jsU_y4sLr8O0tGkXJgT9UiAWX23iVLug4IYUcxCAUkV8jYSVpk3iOteWmSMHrhPcibIMXftgyJOAMaDmuZ91OR7EWgfv4s5qe46dBfK8flssnEhfYi6y9jeomecYsYsw4FU7wssoHt6hl4sIkBjyWbxiUXgRSU_LB4D1OF9ir9cpmunNHI9Zp552qpDollKo_1_zkU45r_9ZhutGTnBHUeyL87hJwL9dONw";

const COUNTRIES = ["ES", "MX", "CO", "AR", "US", "CR", "CL", "PE"] as const;

const LANGUAGES = [
  { code: "ES", level: "native", initial: true },
  { code: "EN", level: "fluent", initial: true },
  { code: "FR", level: "learning", initial: false },
  { code: "PT", level: "basic", initial: false },
] as const;

const INTERESTS = [
  { key: "architecture", icon: "domain", initial: true },
  { key: "analogPhotography", icon: "camera_roll", initial: true },
  { key: "ceramicsCraft", icon: "handyman", initial: true },
  { key: "independentCinema", icon: "movie", initial: false },
  { key: "culinaryHeritage", icon: "restaurant", initial: false },
  { key: "hikingNature", icon: "forest", initial: false },
  { key: "literature", icon: "menu_book", initial: true },
  { key: "latinMusic", icon: "music_note", initial: false },
] as const;

const BIO_MAX = 160;

export function CreatePersonaView() {
  const t = useTranslations("PersonaForm");
  const router = useRouter();

  const [languages, setLanguages] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(LANGUAGES.map((language) => [language.code, language.initial])),
  );
  const [interests, setInterests] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INTERESTS.map((interest) => [interest.key, interest.initial])),
  );
  const [bio, setBio] = useState(
    "Architect and ceramicist based in El Born. Passionate about brutalist forms, analog rolls, and mezcal pairings.",
  );

  const selectedInterests = Object.values(interests).filter(Boolean).length;
  const canSubmit = selectedInterests >= 3;

  function toggleLanguage(code: string) {
    setLanguages((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function toggleInterest(key: string) {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    // No persona backend yet — continue the onboarding flow.
    router.push("/verify");
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl lg:px-margin">
      {/* Header */}
      <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center gap-space-sm">
            <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
              {t("eyebrow")}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
            <span className="font-label-caps text-label-caps tracking-widest text-secondary uppercase">
              {t("eyebrowMeta")}
            </span>
          </div>
          <h1 className="font-headline-xl text-headline-xl-mobile tracking-tight text-on-surface md:text-headline-xl">
            {t("title")}
          </h1>
          <p className="font-headline-sm text-headline-sm font-normal text-secondary italic">
            {t("titleAlt")}
          </p>
        </div>

        <div className="flex items-center gap-space-sm rounded-xl border border-outline-variant bg-surface-low px-space-md py-space-sm">
          <div className="flex items-center gap-space-xs text-tertiary">
            <Icon name="check_circle" filled className="text-[18px]" />
            <span className="font-label-md text-label-md font-semibold">{t("pipeStep1")}</span>
          </div>
          <span className="font-label-md text-label-md text-outline-variant">/</span>
          <div className="flex items-center gap-space-xs font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-label-md text-label-md">{t("pipeStep2")}</span>
          </div>
          <span className="font-label-md text-label-md text-outline-variant">/</span>
          <div className="flex items-center gap-space-xs text-secondary">
            <span className="h-2 w-2 rounded-full bg-[#3E3A35]" />
            <span className="font-label-md text-label-md">{t("pipeStep3")}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
        {/* Guidance column */}
        <aside className="flex flex-col gap-space-lg lg:sticky lg:top-28 lg:col-span-5">
          <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-low shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={t("plateAlt")}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              src={PLATE}
              loading="lazy"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#0B0A09]/90 via-[#0B0A09]/40 to-transparent p-space-lg">
              <span className="mb-1 font-label-caps text-label-caps tracking-widest text-primary uppercase">
                {t("plateBadge")}
              </span>
              <p className="font-headline-sm text-headline-sm leading-snug font-medium text-on-surface">
                {t("plateQuote")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-space-sm rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
            <div className="flex items-center gap-space-xs text-secondary">
              <Icon name="auto_stories" className="text-[20px] text-primary" />
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {t("guideTitle")}
              </h3>
            </div>
            <p className="font-body-md text-body-md leading-relaxed text-secondary">
              {t("guideBody")}
            </p>
            <div className="flex items-center gap-space-md pt-space-xs">
              <div className="flex items-center gap-1.5 text-primary">
                <Icon name="verified" className="text-[16px]" />
                <span className="font-label-caps text-label-caps uppercase">
                  {t("guideVetted")}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary">
                <Icon name="translate" className="text-[16px]" />
                <span className="font-label-caps text-label-caps uppercase">
                  {t("guideBilingual")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg">
            <div className="flex items-start gap-space-md">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-variant text-primary shadow-sm">
                <Icon name="lock" className="text-[22px]" />
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {t("privacyTitle")}
                  </h4>
                  <span className="rounded-lg border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-caps text-label-caps text-secondary shadow-sm">
                    {t("privacyBadge")}
                  </span>
                </div>
                <p className="font-body-sm text-body-sm leading-relaxed text-secondary">
                  {t("privacyBody")}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-space-sm rounded-lg border border-outline-variant bg-surface-container p-space-md shadow-sm">
              <div className="flex items-center gap-space-xs">
                <Icon name="shield" filled className="text-[18px] text-tertiary" />
                <span className="font-label-md text-label-md font-medium text-on-surface">
                  {t("privacyNote")}
                </span>
              </div>
              <span className="font-label-caps text-label-caps font-bold tracking-wider text-tertiary uppercase">
                {t("privacyZero")}
              </span>
            </div>
          </div>
        </aside>

        {/* Form column */}
        <div className="flex flex-col gap-space-xl rounded-xl border border-outline-variant bg-surface-container p-space-lg shadow-sm md:p-space-xl lg:col-span-7">
          <form className="flex flex-col gap-space-xl" onSubmit={submit}>
            {/* 1. Profile photo */}
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("photoLabel")}
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">{t("photoHint")}</p>
                </div>
                <span className="rounded-lg border border-admin-border bg-admin-surface px-2 py-0.5 font-label-caps text-label-caps font-bold text-primary uppercase">
                  {t("required")}
                </span>
              </div>

              <div className="flex flex-col items-center gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg sm:flex-row">
                <div className="group relative shrink-0 cursor-pointer">
                  <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-outline-variant bg-surface-variant shadow-inner transition-transform duration-300 group-hover:scale-105">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={t("avatarAlt")} className="h-full w-full object-cover" src={AVATAR} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60 text-on-surface opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Icon name="photo_camera" className="text-[24px]" />
                      <span className="font-label-caps text-label-caps uppercase">
                        {t("change")}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-white shadow-md">
                    <Icon name="add" className="text-[16px]" />
                  </div>
                </div>

                <div className="flex w-full flex-col gap-space-xs">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button
                      type="button"
                      className="flex items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-[#2E2B27]"
                    >
                      <Icon name="upload_file" className="text-[18px] text-primary" />
                      <span>{t("uploadImage")}</span>
                    </button>
                    <button
                      type="button"
                      className="flex items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-[#2E2B27]"
                    >
                      <Icon name="videocam" className="text-[18px] text-secondary" />
                      <span>{t("useCamera")}</span>
                    </button>
                  </div>
                  <p className="mt-1 font-body-sm text-body-sm text-secondary">
                    {t("photoFormats")}
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Identity & location */}
            <section className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Field label={t("fullName")} meta={t("fullNameMeta")} htmlFor="persona-fullname">
                <div className="relative">
                  <input
                    id="persona-fullname"
                    name="fullname"
                    type="text"
                    defaultValue="Sofia Martínez"
                    placeholder={t("fullNamePlaceholder")}
                    className={inputClass}
                  />
                  <Icon
                    name="badge"
                    className="absolute top-3 right-3 text-[18px] text-secondary"
                  />
                </div>
              </Field>

              <Field label={t("country")} meta={t("countryMeta")} htmlFor="persona-country">
                <div className="relative">
                  <select
                    id="persona-country"
                    name="country"
                    defaultValue="ES"
                    className={cn(inputClass, "cursor-pointer appearance-none pr-10")}
                  >
                    {COUNTRIES.map((code) => (
                      <option key={code} value={code}>
                        {t(`countries.${code}`)}
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    className="pointer-events-none absolute top-3 right-3 text-[18px] text-secondary"
                  />
                </div>
              </Field>

              <Field label={t("city")} meta={t("cityMeta")} htmlFor="persona-city">
                <div className="relative">
                  <input
                    id="persona-city"
                    name="city"
                    type="text"
                    defaultValue="Barcelona"
                    placeholder={t("cityPlaceholder")}
                    className={inputClass}
                  />
                  <Icon
                    name="location_on"
                    className="absolute top-3 right-3 text-[18px] text-secondary"
                  />
                </div>
              </Field>

              <Field label={t("anchor")} meta={t("anchorMeta")} htmlFor="persona-anchor">
                <input
                  id="persona-anchor"
                  name="origin-flavor"
                  type="text"
                  placeholder={t("anchorPlaceholder")}
                  className={inputClass}
                />
              </Field>
            </section>

            {/* 3. Languages */}
            <section className="flex flex-col gap-space-sm">
              <div className="flex flex-col">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t("languagesLabel")}
                </span>
                <p className="font-body-sm text-body-sm text-secondary">{t("languagesHint")}</p>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-space-xs sm:grid-cols-4">
                {LANGUAGES.map((language) => {
                  const active = languages[language.code];
                  return (
                    <button
                      key={language.code}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleLanguage(language.code)}
                      className={cn(
                        "flex items-center justify-between rounded-lg p-space-sm font-label-md text-label-md shadow-sm transition-all",
                        active
                          ? "border border-primary/40 bg-admin-surface font-semibold text-on-surface"
                          : "border border-outline-variant bg-surface-low text-secondary hover:bg-surface-variant hover:text-on-surface",
                      )}
                    >
                      <span>
                        {language.code} • {t(`levels.${language.level}`)}
                      </span>
                      <Icon
                        name="check"
                        className={cn("text-[16px] text-primary", !active && "opacity-0")}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 4. Bio */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-lg text-label-lg font-semibold text-on-surface"
                  htmlFor="persona-bio"
                >
                  {t("bioLabel")}
                </label>
                <span className="font-label-caps text-label-caps font-medium tracking-wider text-secondary">
                  {t("bioCounter", { count: bio.length, max: BIO_MAX })}
                </span>
              </div>
              <textarea
                id="persona-bio"
                name="persona-bio"
                rows={3}
                maxLength={BIO_MAX}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                placeholder={t("bioPlaceholder")}
                className={cn(inputClass, "resize-none leading-relaxed")}
              />
              <p className="font-body-sm text-body-sm text-secondary italic">{t("bioHint")}</p>
            </section>

            {/* 5. Interests */}
            <section className="flex flex-col gap-space-sm">
              <div className="flex items-center justify-between">
                <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                  {t("interestsLabel")}
                </span>
                <span
                  className={cn(
                    "font-label-caps text-label-caps",
                    canSubmit ? "text-secondary" : "text-primary",
                  )}
                >
                  {t("interestsHint", { count: selectedInterests })}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((interest) => {
                  const selected = interests[interest.key];
                  return (
                    <button
                      key={interest.key}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(interest.key)}
                      className={cn(
                        "flex min-h-10 items-center gap-1.5 rounded-lg px-space-md py-1.5 font-label-md text-label-md shadow-sm transition-all",
                        selected
                          ? "border border-primary/40 bg-admin-surface font-semibold text-on-surface"
                          : "border border-outline-variant bg-surface-low text-secondary hover:bg-surface-variant hover:text-on-surface",
                      )}
                    >
                      <Icon
                        name={interest.icon}
                        className={cn("text-[16px]", selected && "text-primary")}
                      />
                      <span>{t(`interests.${interest.key}`)}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 6. Private contact vault */}
            <section className="flex flex-col gap-space-md rounded-xl border border-outline-variant bg-surface-container p-space-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-primary-container text-white">
                    <Icon name="lock" className="text-[14px]" />
                  </div>
                  <h4 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                    {t("vaultTitle")}
                  </h4>
                </div>
                <span className="rounded-lg bg-tertiary px-2 py-0.5 font-label-caps text-label-caps font-bold text-white uppercase">
                  {t("vaultBadge")}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">{t("vaultBody")}</p>

              <div className="mt-1 grid grid-cols-1 gap-space-md md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label
                    className="flex items-center gap-1 font-label-md text-label-md font-semibold text-on-surface"
                    htmlFor="persona-instagram"
                  >
                    <span>{t("instagram")}</span>
                    <span className="font-normal text-secondary">{t("instagramMeta")}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute top-2.5 left-3 font-label-md text-label-md text-secondary">
                      @
                    </span>
                    <input
                      id="persona-instagram"
                      name="instagram"
                      type="text"
                      placeholder={t("instagramPlaceholder")}
                      className={cn(inputClass, "pl-8")}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className="flex items-center gap-1 font-label-md text-label-md font-semibold text-on-surface"
                    htmlFor="persona-chat"
                  >
                    <span>{t("chat")}</span>
                    <span className="font-normal text-secondary">{t("chatMeta")}</span>
                  </label>
                  <div className="relative">
                    <input
                      id="persona-chat"
                      name="chat"
                      type="text"
                      placeholder={t("chatPlaceholder")}
                      className={cn(inputClass, "pr-10")}
                    />
                    <Icon
                      name="chat"
                      className="absolute top-3 right-3 text-[18px] text-secondary"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 text-secondary">
                <Icon name="check_circle" className="text-[16px] text-tertiary" />
                <span className="font-body-sm text-body-sm">{t("vaultNote")}</span>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col-reverse items-center justify-between gap-space-md pt-space-md sm:flex-row">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-lg py-3 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-[#2E2B27] sm:w-auto"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                <span>{t("back")}</span>
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className={cn(
                  "group flex w-full items-center justify-center gap-space-xs rounded-lg px-space-xl py-3 font-label-lg text-label-lg font-semibold shadow-md transition-colors sm:w-auto",
                  canSubmit
                    ? "bg-primary-container text-white hover:bg-primary-hover"
                    : "cursor-not-allowed bg-surface-variant text-secondary",
                )}
              >
                <span>{t("submit")}</span>
                <Icon
                  name="arrow_forward"
                  className="text-[18px] transition-transform duration-200 group-hover:translate-x-1"
                />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-low px-space-md py-2.5 font-body-md text-body-md text-on-surface shadow-sm transition-all placeholder:text-secondary focus:border-primary/50 focus:bg-surface focus:ring-1 focus:ring-primary/40 focus:outline-none";

function Field({
  label,
  meta,
  htmlFor,
  children,
}: {
  label: string;
  meta: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center justify-between font-label-md text-label-md font-semibold text-on-surface"
        htmlFor={htmlFor}
      >
        <span>{label}</span>
        <span className="font-label-caps text-label-caps text-secondary">{meta}</span>
      </label>
      {children}
    </div>
  );
}
