"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CULTURAL_TAGS, PROFILE_BIO } from "../data";
import { ProfileActivity } from "./activity-panel";
import { ContactLocker } from "./contact-locker";
import { DossierHeader } from "./dossier-header";

/** Bilingual bio + cultural-focus tags. */
function BioCard() {
  const t = useTranslations("Profile.bio");
  const tTags = useTranslations("Profile.tags");

  return (
    <section className="bezel-tray">
      <div
        className="space-y-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {t("title")}
          </h2>
          <span className="flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md text-success-text">
            <Icon name="translate" className="text-base" />
            {t("autoMirrored")}
          </span>
        </div>

        <div className="space-y-1">
          <span className="font-label-md text-label-md font-semibold text-primary">
            {t("english")}
          </span>
          <p className="font-body-md text-body-md leading-relaxed text-on-surface">
            {PROFILE_BIO.en}
          </p>
        </div>

        <div className="space-y-1 border-t border-outline-variant pt-space-sm">
          <span className="font-label-md text-label-md font-semibold text-secondary">
            {t("spanish")}
          </span>
          <p className="font-body-sm text-body-sm leading-relaxed text-text-muted italic">
            {PROFILE_BIO.es}
          </p>
        </div>

        <div className="space-y-space-xs border-t border-outline-variant pt-space-sm">
          <span className="block font-label-md text-label-md font-semibold text-text-muted">
            {t("culturalFocus")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {CULTURAL_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-surface-container-highest px-3 py-1.5 font-label-md text-label-md text-on-surface transition-colors duration-300 hover:bg-surface-variant"
              >
                {tTags(tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfileView() {
  return (
    <div className="flex w-full flex-col text-on-surface">
      <DossierHeader />

      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
        <div className="grid grid-cols-1 items-start gap-space-lg lg:grid-cols-12">
          <div className="flex flex-col gap-space-lg lg:col-span-5">
            <BioCard />
            <ContactLocker />
          </div>
          <div className="lg:col-span-7">
            <ProfileActivity />
          </div>
        </div>
      </div>
    </div>
  );
}
