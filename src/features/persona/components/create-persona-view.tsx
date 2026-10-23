"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { savePersonaAction, type PersonaError } from "@/features/persona/actions";
import { uploadImageAction } from "@/features/media/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const COUNTRIES = ["ES", "MX", "CO", "AR", "US", "CR", "CL", "PE", "PT"] as const;

const LANGUAGES = [
  { code: "ES", defaultLevel: "native" },
  { code: "EN", defaultLevel: "fluent" },
] as const;

const LEVELS = ["native", "fluent", "learning", "basic"] as const;

/**
 * Contact channels, in the order they render. At least one must be filled —
 * enforced here for the button state and again in Zod + the `save_persona` RPC.
 */
const CHANNELS = [
  { key: "whatsapp", icon: "call", prefix: "", placeholderKey: "whatsappPlaceholder" },
  { key: "telegram", icon: "send", prefix: "@", placeholderKey: "telegramPlaceholder" },
  { key: "instagram", icon: "photo_camera", prefix: "@", placeholderKey: "instagramPlaceholder" },
  { key: "facebook", icon: "public", prefix: "", placeholderKey: "facebookPlaceholder" },
  { key: "tiktok", icon: "music_note", prefix: "@", placeholderKey: "tiktokPlaceholder" },
  { key: "x", icon: "tag", prefix: "@", placeholderKey: "xPlaceholder" },
] as const;

type ChannelKey = (typeof CHANNELS)[number]["key"];
type LanguageState = Record<string, { active: boolean; level: string }>;

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

export type PersonaInitial = {
  fullName: string;
  country: string;
  city: string;
  dateOfBirth: string;
  languages: { code: string; level: string }[];
  interests: string[];
  bio: string;
  /** Signed URL of the stored avatar, for the edit/resubmit preview. */
  avatarUrl?: string | null;
} & Record<ChannelKey, string>;

export function CreatePersonaView({ initial }: { initial?: PersonaInitial }) {
  const t = useTranslations("PersonaForm");
  const locale = useLocale();
  const router = useRouter();

  const [languages, setLanguages] = useState<LanguageState>(() =>
    Object.fromEntries(
      LANGUAGES.map((language) => {
        const saved = initial?.languages.find((entry) => entry.code === language.code);
        return [
          language.code,
          { active: Boolean(saved) || !initial, level: saved?.level ?? language.defaultLevel },
        ];
      }),
    ),
  );
  const [interests, setInterests] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      INTERESTS.map((interest) => [
        interest.key,
        initial ? initial.interests.includes(interest.key) : interest.initial,
      ]),
    ),
  );
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [contacts, setContacts] = useState<Record<ChannelKey, string>>(() => ({
    whatsapp: initial?.whatsapp ?? "",
    telegram: initial?.telegram ?? "",
    instagram: initial?.instagram ?? "",
    facebook: initial?.facebook ?? "",
    tiktok: initial?.tiktok ?? "",
    x: initial?.x ?? "",
  }));
  const [error, setError] = useState<PersonaError | "upload" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /*
   * The file stays in memory until submit: it is uploaded to the `avatars`
   * bucket first, and the returned storage path travels with the persona
   * payload. On the edit path the preview starts from the stored avatar, and
   * leaving it alone keeps that path untouched.
   */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initial?.avatarUrl ?? null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function previewFile(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("upload");
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  const selectedInterests = Object.values(interests).filter(Boolean).length;
  const selectedLanguages = Object.values(languages).filter((entry) => entry.active).length;
  const hasContact = Object.values(contacts).some((value) => value.trim().length > 0);
  const canSubmit =
    fullName.trim().length >= 2 &&
    city.trim().length > 0 &&
    bio.trim().length > 0 &&
    selectedInterests >= 3 &&
    hasContact &&
    selectedLanguages >= 1;

  function toggleLanguage(code: string) {
    setLanguages((prev) => ({ ...prev, [code]: { ...prev[code], active: !prev[code].active } }));
  }

  function setLanguageLevel(code: string, level: string) {
    setLanguages((prev) => ({ ...prev, [code]: { ...prev[code], level } }));
  }

  function toggleInterest(key: string) {
    setInterests((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "");

    setError(null);
    setSubmitting(true);

    try {
      let avatarPath = "";

      if (photoFile) {
        const upload = new FormData();
        upload.set("bucket", "avatars");
        upload.set("file", photoFile);
        const uploaded = await uploadImageAction(upload);
        if (!uploaded.ok) {
          setError("upload");
          setSubmitting(false);
          return;
        }
        avatarPath = uploaded.path;
      }

      const result = await savePersonaAction({
        fullName: text("fullname"),
        country: text("country"),
        city: text("city"),
        dateOfBirth: text("date-of-birth"),
        avatarPath,
        languages: LANGUAGES.filter((language) => languages[language.code].active).map(
          (language) => ({
            code: language.code,
            level: languages[language.code].level,
          }),
        ),
        interests: INTERESTS.filter((interest) => interests[interest.key]).map(
          (interest) => interest.key,
        ),
        bio,
        whatsapp: contacts.whatsapp,
        telegram: contacts.telegram,
        instagram: contacts.instagram,
        facebook: contacts.facebook,
        tiktok: contacts.tiktok,
        x: contacts.x,
        locale,
      });

      // A successful save redirects; only errors return here.
      if (!result.ok) {
        setError(result.error);
        setSubmitting(false);
        return;
      }
      router.push(result.redirectTo);
    } catch {
      // A failed Server Action must not leave the form stuck.
      setError("unknown");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl lg:px-margin">
      {/* Header */}
      <div className="mb-space-xl flex flex-col justify-between gap-space-md md:flex-row md:items-end">
        <div className="flex flex-col gap-space-xs">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-caps text-label-caps font-bold tracking-wider text-primary uppercase">
              {t("eyebrow")}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-outline-variant" />
            <span className="font-label-caps text-label-caps tracking-widest text-secondary uppercase">
              {t("eyebrowMeta")}
            </span>
          </div>
          <h1 className="font-display-md text-display-md-mobile text-balance text-on-surface md:text-display-md">
            {t("title")}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm rounded-xl border border-outline-variant bg-surface-low px-space-md py-space-sm">
          <div className="flex items-center gap-space-xs text-tertiary">
            <Icon name="check_circle" filled className="text-[18px]" />
            <span className="font-label-md text-label-md font-semibold whitespace-nowrap">
              {t("pipeStep1")}
            </span>
          </div>
          <span className="font-label-md text-label-md text-outline-variant">/</span>
          <div className="flex items-center gap-space-xs font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="font-label-md text-label-md whitespace-nowrap">{t("pipeStep2")}</span>
          </div>
          <span className="font-label-md text-label-md text-outline-variant">/</span>
          <div className="flex items-center gap-space-xs text-secondary">
            <span className="h-2 w-2 rounded-full bg-outline-strong" />
            <span className="font-label-md text-label-md whitespace-nowrap">{t("pipeStep3")}</span>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl">
        <div className="flex flex-col gap-space-lg rounded-xl border border-outline-variant bg-surface-container p-space-lg shadow-sm md:gap-space-xl md:p-space-xl">
          <form className="flex flex-col gap-space-lg md:gap-space-xl" onSubmit={submit}>
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-space-sm rounded-2xl border border-danger-border bg-danger-surface p-space-md"
              >
                <Icon name="error_outline" className="mt-0.5 shrink-0 text-lg text-danger-text" />
                <span className="font-body-sm text-body-sm text-danger-text">
                  {t(
                    error === "invalid"
                      ? "errorInvalid"
                      : error === "upload"
                        ? "errorUpload"
                        : "errorUnknown",
                  )}
                </span>
              </div>
            ) : null}
            {/* 1. Profile photo */}
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("photoLabel")}
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">{t("photoHint")}</p>
                </div>
                <span className="rounded-lg border border-outline-variant bg-surface-variant px-2 py-0.5 font-label-caps text-label-caps font-bold text-secondary uppercase">
                  {t("optional")}
                </span>
              </div>

              <div className="flex flex-col items-center gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg sm:flex-row">
                <div className="group relative shrink-0 cursor-pointer">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("change")}
                    className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-outline-variant bg-surface-variant shadow-inner transition-transform duration-300 group-hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        alt={t("avatarAlt")}
                        className="h-full w-full object-cover"
                        src={photoPreview}
                      />
                    ) : (
                      <DefaultAvatar className="h-full w-full" />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60 text-on-surface opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <Icon name="photo_camera" className="text-[24px]" />
                      <span className="font-label-caps text-label-caps uppercase">
                        {t("change")}
                      </span>
                    </div>
                  </button>
                  <div className="pointer-events-none absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-container text-white shadow-md">
                    <Icon name="add" className="text-[16px]" />
                  </div>
                </div>

                <div className="flex w-full flex-col gap-space-xs">
                  <div className="flex flex-wrap items-center gap-space-xs">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-11 items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
                    >
                      <Icon name="upload_file" className="text-[18px] text-primary" />
                      <span>{t("uploadImage")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="flex min-h-11 items-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
                    >
                      <Icon name="videocam" className="text-[18px] text-secondary" />
                      <span>{t("useCamera")}</span>
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => {
                      previewFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="user"
                    className="sr-only"
                    onChange={(event) => {
                      previewFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
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
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
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
                    defaultValue={initial?.country ?? "ES"}
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
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    placeholder={t("cityPlaceholder")}
                    className={inputClass}
                  />
                  <Icon
                    name="location_on"
                    className="absolute top-3 right-3 text-[18px] text-secondary"
                  />
                </div>
              </Field>

              <Field label={t("dobLabel")} meta={t("dobMeta")} htmlFor="persona-dob">
                <input
                  id="persona-dob"
                  name="date-of-birth"
                  type="date"
                  defaultValue={initial?.dateOfBirth ?? ""}
                  className={cn(inputClass, "cursor-pointer")}
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
              <div className="mt-1 grid grid-cols-1 gap-space-xs sm:grid-cols-2">
                {LANGUAGES.map((language) => {
                  const state = languages[language.code];
                  return (
                    <div
                      key={language.code}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-space-sm rounded-lg p-space-sm shadow-sm transition-all",
                        state.active
                          ? "border border-primary/40 bg-admin-surface"
                          : "border border-outline-variant bg-surface-low",
                      )}
                    >
                      <button
                        type="button"
                        aria-pressed={state.active}
                        onClick={() => toggleLanguage(language.code)}
                        className={cn(
                          "flex min-h-9 items-center gap-space-xs font-label-md text-label-md transition-colors",
                          state.active
                            ? "font-semibold text-on-surface"
                            : "text-secondary hover:text-on-surface",
                        )}
                      >
                        <Icon
                          name={state.active ? "check_circle" : "circle"}
                          className={cn(
                            "text-[18px]",
                            state.active ? "text-primary" : "text-outline-variant",
                          )}
                        />
                        <span>{language.code}</span>
                      </button>

                      <div className="relative">
                        <select
                          aria-label={`${language.code} ${t("languagesLabel")}`}
                          value={state.level}
                          disabled={!state.active}
                          onChange={(event) => setLanguageLevel(language.code, event.target.value)}
                          className={cn(
                            "h-9 cursor-pointer appearance-none rounded-md border border-outline-variant bg-surface-low pr-8 pl-3 font-label-md text-label-md text-on-surface transition-colors",
                            "hover:border-outline-hover focus:border-primary/50 focus:outline-none",
                            !state.active && "cursor-not-allowed opacity-50",
                          )}
                        >
                          {LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {t(`levels.${level}`)}
                            </option>
                          ))}
                        </select>
                        <Icon
                          name="expand_more"
                          className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-[16px] text-secondary"
                        />
                      </div>
                    </div>
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
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
                        "flex min-h-11 items-center gap-1.5 rounded-lg px-space-md py-1.5 font-label-md text-label-md shadow-sm transition-all",
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
                <span className="shrink-0 rounded-lg bg-tertiary px-2 py-0.5 font-label-caps text-label-caps font-bold whitespace-nowrap text-white uppercase">
                  {t("vaultBadge")}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-secondary">{t("vaultBody")}</p>

              <div className="mt-1 grid grid-cols-1 gap-space-md md:grid-cols-2">
                {CHANNELS.map((channel) => (
                  <div key={channel.key} className="flex flex-col gap-1.5">
                    <label
                      className="flex items-center gap-1 font-label-md text-label-md font-semibold text-on-surface"
                      htmlFor={`persona-${channel.key}`}
                    >
                      <span>{t(channel.key)}</span>
                    </label>
                    <div className="relative">
                      {channel.prefix ? (
                        <span className="absolute top-2.5 left-3 font-label-md text-label-md text-secondary">
                          {channel.prefix}
                        </span>
                      ) : null}
                      <input
                        id={`persona-${channel.key}`}
                        name={channel.key}
                        type="text"
                        value={contacts[channel.key]}
                        onChange={(event) =>
                          setContacts((prev) => ({ ...prev, [channel.key]: event.target.value }))
                        }
                        placeholder={t(channel.placeholderKey)}
                        className={cn(inputClass, channel.prefix && "pl-8", "pr-10")}
                      />
                      <Icon
                        name={channel.icon}
                        className="absolute top-3 right-3 text-[18px] text-secondary"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div
                className={cn(
                  "flex items-center gap-2 pt-1",
                  hasContact ? "text-secondary" : "text-primary",
                )}
              >
                <Icon
                  name={hasContact ? "check_circle" : "error"}
                  className={cn("text-[16px]", hasContact ? "text-tertiary" : "text-primary")}
                />
                <span className="font-body-sm text-body-sm">
                  {t(hasContact ? "vaultNote" : "contactRequired")}
                </span>
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col items-center justify-between gap-space-md pt-space-md sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex w-full items-center justify-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-lg py-3 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-container-high sm:w-auto"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                <span>{t("back")}</span>
              </button>
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className={cn(
                  "group flex w-full items-center justify-center gap-space-xs rounded-lg px-space-md py-3 text-center font-label-lg text-label-lg font-semibold shadow-md transition-colors sm:w-auto sm:px-space-xl",
                  canSubmit && !submitting
                    ? "bg-primary-container text-white hover:bg-primary-hover"
                    : "cursor-not-allowed bg-surface-variant text-secondary",
                )}
              >
                <span>{submitting ? t("submitting") : t("submit")}</span>
                {submitting ? (
                  <Spinner className="h-4 w-4 text-current" label={t("submitting")} />
                ) : (
                  <Icon
                    name="arrow_forward"
                    className="text-[18px] transition-transform duration-200 group-hover:translate-x-1"
                  />
                )}
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
