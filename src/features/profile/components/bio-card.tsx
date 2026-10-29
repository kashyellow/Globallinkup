"use client";

import { useTranslations } from "next-intl";
import { SectionHead } from "./section-head";

/** 03 — Bio. */
export function BioCard({ bio }: { bio: string }) {
  const t = useTranslations("Profile.bio");

  return (
    <section>
      <SectionHead index="03" title={t("title")} />

      <p className="mt-space-md max-w-[62ch] font-body-md text-body-md leading-relaxed text-on-surface">
        {bio}
      </p>
    </section>
  );
}
