"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { CULTURAL_TAGS, PROFILE_BIO } from "../data";
import { ProfileActivity } from "./activity-panel";
import { ContactLocker } from "./contact-locker";
import { DossierHeader } from "./dossier-header";

/** Bilingual bio + cultural focus tags. */
function BioCard() {
  const t = useTranslations("Profile.bio");
  const tTags = useTranslations("Profile.tags");

  return (
    <div className="space-y-space-md rounded-2xl bg-surface-container p-space-lg shadow-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <span className="font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
          {t("title")}
        </span>
        <span className="flex items-center gap-1 font-label-md text-label-md text-tertiary">
          <Icon name="translate" className="text-[15px]" />
          {t("autoMirrored")}
        </span>
      </div>

      <div className="space-y-1">
        <span className="font-label-caps text-[10px] font-bold tracking-widest text-primary uppercase">
          {t("english")}
        </span>
        <p className="font-body-md text-body-md leading-relaxed text-on-surface">
          {PROFILE_BIO.en}
        </p>
      </div>

      <div className="space-y-1 pt-space-xs">
        <span className="font-label-caps text-[10px] font-bold tracking-widest text-secondary uppercase">
          {t("spanish")}
        </span>
        <p className="font-body-sm text-body-sm leading-relaxed text-text-muted italic">
          {PROFILE_BIO.es}
        </p>
      </div>

      <div className="space-y-space-xs pt-space-sm">
        <span className="block font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
          {t("culturalFocus")}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {CULTURAL_TAGS.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-surface-container-highest px-3 py-1 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container-high"
            >
              {tTags(tag)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProfileView() {
  return (
    <div className="flex w-full flex-col text-on-surface">
      <DossierHeader />

      <div className="mx-auto w-full max-w-[1240px] px-margin-mobile py-space-xl md:px-margin">
        <div className="grid grid-cols-1 gap-space-xl lg:grid-cols-12">
          <div className="space-y-space-xl lg:col-span-5">
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
