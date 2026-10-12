"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { DOSSIER } from "../data";

export function PersonaDossier() {
  const t = useTranslations("Discover");
  const tCommon = useTranslations("Common");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="bezel-tray">
      <div
        className="overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        {/* Banner */}
        <div className="relative aspect-[16/10] w-full bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={DOSSIER.bannerAlt}
            className="h-full w-full object-cover"
            src={DOSSIER.banner}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent"
          />
          <div className="absolute right-space-md bottom-space-sm left-space-md flex items-end justify-between gap-space-sm text-white">
            <div>
              <h2 className="font-headline-lg text-headline-lg-mobile font-bold text-balance text-white md:text-headline-lg">
                {DOSSIER.name}
              </h2>
              <p className="font-body-sm text-body-sm text-white/90">{t("dossier.meta")}</p>
            </div>
            <span className="shrink-0 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 font-label-md text-label-md whitespace-nowrap text-white">
              {t("dossier.photoCount")}
            </span>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 gap-1 border-b border-outline-variant bg-surface-dim p-space-sm">
          {DOSSIER.gallery.map((src, index) => (
            <div
              key={src}
              className={cn(
                "aspect-square overflow-hidden rounded shadow-sm",
                index === 0
                  ? "ring-2 ring-primary-container"
                  : "opacity-70 transition-opacity hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={DOSSIER.galleryAlts[index]}
                className="h-full w-full object-cover"
                src={src}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        <div className="space-y-space-md p-space-lg">
          {/* Bio */}
          <div className="space-y-space-xs rounded-xl border border-outline-variant bg-surface-container p-space-md">
            <span className="font-label-lg text-label-lg font-semibold text-primary">
              {t("dossier.personaNote")}
            </span>
            <p className="font-body-md text-body-md text-on-surface-strong italic">
              {t("dossier.bio")}
            </p>
          </div>

          {/* Fluency */}
          <div className="space-y-space-xs">
            <span className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("fluency.label")}
            </span>
            <div className="grid grid-cols-1 gap-space-sm sm:grid-cols-2">
              <div className="flex items-center justify-between gap-space-sm rounded-lg border border-outline-variant bg-surface-container p-space-sm">
                <span className="font-label-md text-label-md font-semibold text-on-surface-strong">
                  {t("fluency.spanish")}
                </span>
                <span className="font-label-md text-label-md text-tertiary">
                  {t("fluency.nativeC2")}
                </span>
              </div>
              <div className="flex items-center justify-between gap-space-sm rounded-lg border border-outline-variant bg-surface-container p-space-sm">
                <span className="font-label-md text-label-md font-semibold text-on-surface-strong">
                  {t("fluency.english")}
                </span>
                <span className="font-label-md text-label-md text-secondary">
                  {t("fluency.conversationalB2")}
                </span>
              </div>
            </div>
          </div>

          {/* Contact security layer */}
          <div className="space-y-space-xs">
            <div className="flex items-center justify-between">
              <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("dossier.contactLayer")}
              </span>
              <Icon name="enhanced_encryption" className="text-sm text-primary-container" />
            </div>

            {revealed ? (
              <div className="space-y-space-sm rounded-xl border border-success-border bg-success-surface p-space-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="check_circle" className="text-lg text-tertiary" />
                    <span className="font-label-lg text-label-lg font-semibold text-on-surface-strong">
                      {t("dossier.unlockedTitle")}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevealed(false)}
                    className="text-xs text-secondary underline hover:text-on-surface-strong"
                  >
                    {tCommon("reset")}
                  </button>
                </div>

                <div className="space-y-space-xs rounded-lg border border-outline-variant bg-surface p-space-sm shadow-sm">
                  <ContactRow
                    icon="photo_camera"
                    label={t("dossier.instagram")}
                    value={DOSSIER.contact.instagram}
                    unlockedLabel={tCommon("unlocked")}
                  />
                  <ContactRow
                    icon="chat"
                    iconClass="text-tertiary"
                    label={t("dossier.whatsapp")}
                    value={DOSSIER.contact.whatsapp}
                    unlockedLabel={tCommon("unlocked")}
                  />
                  <ContactRow
                    icon="mail"
                    iconClass="text-secondary"
                    label={t("dossier.email")}
                    value={DOSSIER.contact.email}
                    unlockedLabel={tCommon("unlocked")}
                  />
                </div>

                <p className="font-body-sm text-xs text-secondary">{t("dossier.unlockedNote")}</p>
              </div>
            ) : (
              <div className="space-y-space-sm rounded-xl border border-outline-variant bg-surface-container p-space-md">
                <div className="flex items-start gap-space-sm">
                  <div className="rounded-full border border-border-strong bg-secondary-container p-2 text-primary-container">
                    <Icon name="lock" className="text-base" />
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg font-semibold text-on-surface-strong">
                      {t("dossier.lockedTitle")}
                    </h4>
                    <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                      {t("dossier.lockedBody", { name: DOSSIER.name })}
                    </p>
                  </div>
                </div>

                <div className="pointer-events-none flex flex-col gap-1 rounded-lg border border-outline-variant bg-surface p-space-sm blur-[3px] select-none">
                  <div className="flex items-center gap-2 text-text-muted">
                    <Icon name="alternate_email" className="text-sm" />
                    <span className="font-body-sm text-body-sm">{t("dossier.lockedHandle")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-text-muted">
                    <Icon name="chat" className="text-sm" />
                    <span className="font-body-sm text-body-sm">{t("dossier.lockedPhone")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setRevealed(true)}
                    className="flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg font-semibold text-primary transition-colors duration-300 hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <span>{t("dossier.simulateAcceptance")}</span>
                    <Icon name="arrow_forward" className="text-xs" />
                  </button>
                  <span className="font-label-caps text-label-caps text-text-muted">
                    {t("dossier.autoEncrypted")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Primary CTA */}
          <button
            type="button"
            className={cn(
              "group flex w-full items-center justify-center gap-space-sm rounded-full bg-primary px-space-md py-3 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
            )}
          >
            <Icon name="send" />
            <span>{t("dossier.sendRequest", { name: DOSSIER.name })}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ContactRow({
  icon,
  iconClass,
  label,
  value,
  unlockedLabel,
}: {
  icon: string;
  iconClass?: string;
  label: string;
  value: string;
  unlockedLabel: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-on-surface-strong">
        <Icon name={icon} className={cn("text-sm", iconClass ?? "text-primary-container")} />
        <span className="font-label-md text-label-md font-medium">{label}</span>
        <span className="font-body-sm text-body-sm text-on-surface select-all">{value}</span>
      </div>
      <span className="font-label-caps text-label-caps text-tertiary">{unlockedLabel}</span>
    </div>
  );
}
