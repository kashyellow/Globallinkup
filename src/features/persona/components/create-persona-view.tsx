"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { signUpAction, type AuthError } from "@/features/auth/actions";
import { useRegistrationDraft } from "@/features/auth/components/registration-draft-provider";
import { savePersonaAction, type PersonaError } from "@/features/persona/actions";
import { uploadImageAction } from "@/features/media/actions";
import { INTEREST_MAX } from "@/lib/persona/interests";
import { Link, useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

import { InterestCombobox, type InterestCatalogItem } from "./interest-combobox";

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

const BIO_MAX = 160;
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

type FormField = "photo" | "fullName" | "city" | "bio" | "interests" | "languages" | "contacts";

const FIELD_ORDER: FormField[] = [
  "photo",
  "fullName",
  "city",
  "bio",
  "interests",
  "languages",
  "contacts",
];

const FIELD_INPUT_ID: Record<FormField, string> = {
  photo: "persona-photo",
  fullName: "persona-fullname",
  city: "persona-city",
  bio: "persona-bio",
  interests: "persona-interests",
  languages: "persona-language-ES",
  contacts: "persona-whatsapp",
};

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

export function CreatePersonaView({
  initial,
  interestCatalog,
  isAuthenticated,
}: {
  initial?: PersonaInitial;
  interestCatalog: InterestCatalogItem[];
  isAuthenticated: boolean;
}) {
  const t = useTranslations("PersonaForm");
  const tRegister = useTranslations("Auth.register");
  const locale = useLocale();
  const router = useRouter();
  const { draft, clearDraft } = useRegistrationDraft();

  const [languages, setLanguages] = useState<LanguageState>(() =>
    Object.fromEntries(
      LANGUAGES.map((language) => {
        const saved = initial?.languages.find((entry) => entry.code === language.code);
        return [
          language.code,
          { active: Boolean(saved), level: saved?.level ?? language.defaultLevel },
        ];
      }),
    ),
  );
  const [interests, setInterests] = useState<string[]>(() =>
    initial
      ? Array.from(new Set(initial.interests.map((interest) => interest.trim()).filter(Boolean)))
      : [],
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
  const [error, setError] = useState<PersonaError | AuthError | "upload" | null>(null);
  const [rejectedInterests, setRejectedInterests] = useState<string[]>([]);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({});
  const [showValidation, setShowValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);

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

  // A direct visit or a refresh has no in-memory draft. Send the visitor back
  // to step 1 instead of letting them fill a persona that cannot be submitted.
  useEffect(() => {
    if (!isAuthenticated && !accountCreated && !draft) {
      router.replace("/register");
    }
  }, [accountCreated, draft, isAuthenticated, router]);

  function previewFile(file?: File) {
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > AVATAR_MAX_BYTES
    ) {
      setError("upload");
      setFieldErrors((previous) => ({ ...previous, photo: t("photoInvalid") }));
      return;
    }
    setError(null);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    clearFieldError("photo");
  }

  const selectedInterests = interests.length;
  const selectedLanguages = Object.values(languages).filter((entry) => entry.active).length;
  const hasContact = Object.values(contacts).some((value) => value.trim().length > 0);
  const requiresPhoto = !initial?.avatarUrl;
  const hasPhoto = Boolean(photoFile || initial?.avatarUrl);
  const isAccount = isAuthenticated || accountCreated;

  function clearFieldError(field: FormField) {
    setFieldErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  function validateForm(): Partial<Record<FormField, string>> {
    const errors: Partial<Record<FormField, string>> = {};

    if (requiresPhoto && !hasPhoto) errors.photo = t("photoRequired");
    if (fullName.trim().length < 2) errors.fullName = t("fullNameRequired");
    if (city.trim().length === 0) errors.city = t("cityRequired");
    if (bio.trim().length === 0) errors.bio = t("bioRequired");
    if (selectedInterests < 3) errors.interests = t("interestsRequired");
    if (selectedLanguages < 1) errors.languages = t("languagesRequired");
    if (!hasContact) errors.contacts = t("contactRequired");

    return errors;
  }

  function focusField(field: FormField) {
    const element = document.getElementById(FIELD_INPUT_ID[field]);
    const target =
      element instanceof HTMLElement && /^(INPUT|BUTTON|SELECT|TEXTAREA)$/.test(element.tagName)
        ? element
        : element?.querySelector<HTMLElement>("input, button, select, textarea");
    target?.focus();
    (element ?? target)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function toggleLanguage(code: string) {
    setLanguages((prev) => ({ ...prev, [code]: { ...prev[code], active: !prev[code].active } }));
    clearFieldError("languages");
  }

  function setLanguageLevel(code: string, level: string) {
    setLanguages((prev) => ({ ...prev, [code]: { ...prev[code], level } }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setRejectedInterests([]);
    setInterestError(null);

    const nextErrors = validateForm();
    setFieldErrors(nextErrors);
    setShowValidation(true);

    const firstInvalid = FIELD_ORDER.find((field) => nextErrors[field]);
    if (firstInvalid) {
      focusField(firstInvalid);
      return;
    }

    if (!isAccount && !draft) {
      router.replace("/register");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "");

    setSubmitting(true);

    try {
      if (!isAccount && draft) {
        const signup = await signUpAction({
          email: draft.email,
          password: draft.password,
          confirm: draft.password,
          acceptedTerms: draft.acceptedTerms,
        });
        if (!signup.ok) {
          setError(signup.error);
          setSubmitting(false);
          return;
        }
        setAccountCreated(true);
      }

      let avatarPath = "";

      if (photoFile) {
        const upload = new FormData();
        upload.set("bucket", "avatars");
        upload.set("file", photoFile);
        const uploaded = await uploadImageAction(upload);
        if (!uploaded.ok) {
          setError("upload");
          setFieldErrors((previous) => ({ ...previous, photo: t("photoInvalid") }));
          setSubmitting(false);
          focusField("photo");
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
        interests,
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
        setSubmitting(false);

        if (result.error === "avatarRequired") {
          setFieldErrors((previous) => ({ ...previous, photo: t("photoRequired") }));
          setShowValidation(true);
          focusField("photo");
          return;
        }

        if (result.error === "interestRejected") {
          setRejectedInterests(result.rejectedInterests ?? []);
          setError("interestRejected");
          setInterestError(t("interestRejectedGeneric"));
          focusField("interests");
          return;
        }

        if (result.error === "interestRateLimit") {
          setError("interestRateLimit");
          setInterestError(t("interestRateLimit"));
          focusField("interests");
          return;
        }

        setError(result.error);
        return;
      }
      clearDraft();
      router.push(result.redirectTo);
    } catch {
      // A failed Server Action must not leave the form stuck.
      setError("unknown");
      setSubmitting(false);
    }
  }

  const missingLabels = FIELD_ORDER.filter((field) => fieldErrors[field]).map((field) =>
    t(`missing.${field}`),
  );

  let errorMessage: string | null = null;
  if (error === "interestRejected") {
    errorMessage =
      rejectedInterests.length > 0
        ? t("interestRejected", { labels: rejectedInterests.join(", ") })
        : t("interestRejectedGeneric");
  } else if (error === "interestRateLimit") {
    errorMessage = t("interestRateLimit");
  } else if (error === "emailInUse") {
    errorMessage = tRegister("errorEmailInUse");
  } else if (error === "weakPassword") {
    errorMessage = tRegister("errorWeakPassword");
  } else if (error === "rateLimited") {
    errorMessage = tRegister("errorRateLimited");
  } else if (error === "confirmEmail") {
    errorMessage = tRegister("errorConfirmEmail");
  } else if (error === "invalid") {
    errorMessage = t("errorInvalid");
  } else if (error === "upload") {
    errorMessage = t("errorUpload");
  } else if (error) {
    errorMessage = t("errorUnknown");
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
          <form className="flex flex-col gap-space-lg md:gap-space-xl" noValidate onSubmit={submit}>
            <p className="font-body-sm text-body-sm text-secondary">{t("requiredHint")}</p>
            {error ? (
              <div
                role="alert"
                className="flex items-start gap-space-sm rounded-2xl border border-danger-border bg-danger-surface p-space-md"
              >
                <Icon name="error_outline" className="mt-0.5 shrink-0 text-lg text-danger-text" />
                <span className="font-body-sm text-body-sm text-danger-text">{errorMessage}</span>
              </div>
            ) : null}
            {/* 1. Profile photo */}
            <section className="flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="block font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("photoLabel")}
                    {requiresPhoto ? (
                      <span aria-hidden className="ml-0.5 text-danger-text">
                        *
                      </span>
                    ) : null}
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">{t("photoHint")}</p>
                </div>
                <span
                  className={cn(
                    "rounded-lg border px-2 py-0.5 font-label-caps text-label-caps font-bold uppercase",
                    requiresPhoto
                      ? "border-primary/30 bg-admin-surface text-primary"
                      : "border-outline-variant bg-surface-variant text-secondary",
                  )}
                >
                  {requiresPhoto ? t("required") : t("optional")}
                </span>
              </div>

              <div
                className={cn(
                  "flex flex-col items-center gap-space-lg rounded-xl border bg-surface-low p-space-lg sm:flex-row",
                  fieldErrors.photo ? "border-danger-border-strong" : "border-outline-variant",
                )}
              >
                <div className="group relative shrink-0 cursor-pointer">
                  <button
                    id="persona-photo"
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t("change")}
                    aria-describedby={fieldErrors.photo ? "persona-photo-error" : undefined}
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

              {fieldErrors.photo ? (
                <p
                  id="persona-photo-error"
                  role="alert"
                  className="font-body-sm text-body-sm text-danger-text"
                >
                  {fieldErrors.photo}
                </p>
              ) : null}
            </section>

            {/* 2. Identity & location */}
            <section className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              <Field
                label={t("fullName")}
                meta={t("fullNameMeta")}
                htmlFor="persona-fullname"
                required
                error={fieldErrors.fullName}
              >
                <div className="relative">
                  <input
                    id="persona-fullname"
                    name="fullname"
                    type="text"
                    required
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      clearFieldError("fullName");
                    }}
                    placeholder={t("fullNamePlaceholder")}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? "persona-fullname-error" : undefined}
                    className={cn(
                      inputClass,
                      fieldErrors.fullName && "border-danger-border-strong",
                    )}
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

              <Field
                label={t("city")}
                meta={t("cityMeta")}
                htmlFor="persona-city"
                required
                error={fieldErrors.city}
              >
                <div className="relative">
                  <input
                    id="persona-city"
                    name="city"
                    type="text"
                    required
                    value={city}
                    onChange={(event) => {
                      setCity(event.target.value);
                      clearFieldError("city");
                    }}
                    placeholder={t("cityPlaceholder")}
                    aria-invalid={Boolean(fieldErrors.city)}
                    aria-describedby={fieldErrors.city ? "persona-city-error" : undefined}
                    className={cn(inputClass, fieldErrors.city && "border-danger-border-strong")}
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
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("languagesLabel")}
                    <span aria-hidden className="ml-0.5 text-danger-text">
                      *
                    </span>
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">{t("languagesHint")}</p>
                </div>
                <span className="rounded-lg border border-primary/30 bg-admin-surface px-2 py-0.5 font-label-caps text-label-caps font-bold text-primary uppercase">
                  {t("required")}
                </span>
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
                        id={`persona-language-${language.code}`}
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
              {fieldErrors.languages ? (
                <p role="alert" className="font-body-sm text-body-sm text-danger-text">
                  {fieldErrors.languages}
                </p>
              ) : null}
            </section>

            {/* 4. Bio */}
            <section className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className="font-label-lg text-label-lg font-semibold text-on-surface"
                  htmlFor="persona-bio"
                >
                  {t("bioLabel")}
                  <span aria-hidden className="ml-0.5 text-danger-text">
                    *
                  </span>
                </label>
                <span className="font-label-caps text-label-caps font-medium tracking-wider text-secondary">
                  {t("bioCounter", { count: bio.length, max: BIO_MAX })}
                </span>
              </div>
              <textarea
                id="persona-bio"
                name="persona-bio"
                rows={3}
                required
                maxLength={BIO_MAX}
                value={bio}
                onChange={(event) => {
                  setBio(event.target.value);
                  clearFieldError("bio");
                }}
                placeholder={t("bioPlaceholder")}
                aria-invalid={Boolean(fieldErrors.bio)}
                aria-describedby={fieldErrors.bio ? "persona-bio-error" : "persona-bio-hint"}
                className={cn(
                  inputClass,
                  "resize-none leading-relaxed",
                  fieldErrors.bio && "border-danger-border-strong",
                )}
              />
              {fieldErrors.bio ? (
                <p
                  id="persona-bio-error"
                  role="alert"
                  className="font-body-sm text-body-sm text-danger-text"
                >
                  {fieldErrors.bio}
                </p>
              ) : null}
              <p id="persona-bio-hint" className="font-body-sm text-body-sm text-secondary italic">
                {t("bioHint")}
              </p>
            </section>

            {/* 5. Interests */}
            <section className="flex flex-col gap-space-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("interestsLabel")}
                    <span aria-hidden className="ml-0.5 text-danger-text">
                      *
                    </span>
                  </span>
                  <p className="font-body-sm text-body-sm text-secondary">
                    {t("interestsHint", { count: selectedInterests })}
                  </p>
                </div>
                <span className="self-start rounded-lg border border-primary/30 bg-admin-surface px-2 py-0.5 font-label-caps text-label-caps font-bold text-primary uppercase">
                  {t("required")}
                </span>
              </div>

              <InterestCombobox
                options={interestCatalog}
                selected={interests}
                onChange={(next) => {
                  setInterests(next);
                  setInterestError(null);
                  if (error === "interestRejected" || error === "interestRateLimit") {
                    setError(null);
                    setRejectedInterests([]);
                  }
                  clearFieldError("interests");
                }}
                error={fieldErrors.interests ?? interestError ?? undefined}
              />

              {selectedInterests >= INTEREST_MAX ? (
                <p className="font-body-sm text-body-sm text-secondary">
                  {t("interestMax", { max: INTEREST_MAX })}
                </p>
              ) : null}
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
                    <span aria-hidden className="ml-0.5 text-danger-text">
                      *
                    </span>
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
                        onChange={(event) => {
                          setContacts((prev) => ({ ...prev, [channel.key]: event.target.value }));
                          clearFieldError("contacts");
                        }}
                        placeholder={t(channel.placeholderKey)}
                        aria-invalid={Boolean(fieldErrors.contacts)}
                        aria-describedby={
                          fieldErrors.contacts ? "persona-contacts-error" : undefined
                        }
                        className={cn(
                          inputClass,
                          channel.prefix && "pl-8",
                          "pr-10",
                          fieldErrors.contacts && "border-danger-border-strong",
                        )}
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
                id="persona-contacts-error"
                role={fieldErrors.contacts ? "alert" : undefined}
                className={cn(
                  "flex items-center gap-2 pt-1",
                  hasContact ? "text-secondary" : "text-danger-text",
                )}
              >
                <Icon
                  name={hasContact ? "check_circle" : "error"}
                  className={cn("text-[16px]", hasContact ? "text-tertiary" : "text-danger-text")}
                />
                <span className="font-body-sm text-body-sm">
                  {t(hasContact ? "vaultNote" : "contactRequired")}
                </span>
              </div>
            </section>

            {showValidation && missingLabels.length > 0 ? (
              <InlineAlert>
                <strong className="font-semibold">{t("missingTitle")}</strong>{" "}
                {t("missingFields", { fields: missingLabels.join(", ") })}
              </InlineAlert>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col items-center justify-between gap-space-md pt-space-md sm:flex-row">
              <Link
                href={isAccount ? "/" : "/register"}
                className="flex w-full items-center justify-center gap-space-xs rounded-lg border border-outline-variant bg-surface-variant px-space-lg py-3 font-label-lg text-label-lg text-on-surface shadow-sm transition-colors hover:bg-surface-container-high sm:w-auto"
              >
                <Icon name="arrow_back" className="text-[18px]" />
                <span>{isAccount ? t("backHome") : t("back")}</span>
              </Link>
              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className={cn(
                  "group flex w-full items-center justify-center gap-space-xs rounded-lg px-space-md py-3 text-center font-label-lg text-label-lg font-semibold shadow-md transition-colors sm:w-auto sm:px-space-xl",
                  submitting
                    ? "cursor-wait bg-surface-variant text-secondary"
                    : "bg-primary-container text-white hover:bg-primary-hover",
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
  required = false,
  error,
  children,
}: {
  label: string;
  meta: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="flex items-center justify-between font-label-md text-label-md font-semibold text-on-surface"
        htmlFor={htmlFor}
      >
        <span>
          {label}
          {required ? (
            <span aria-hidden className="ml-0.5 text-danger-text">
              *
            </span>
          ) : null}
        </span>
        <span className="font-label-caps text-label-caps text-secondary">{meta}</span>
      </label>
      {children}
      {error ? (
        <p
          id={`${htmlFor}-error`}
          role="alert"
          className="font-body-sm text-body-sm text-danger-text"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
