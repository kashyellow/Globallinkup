"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { CULTURAL_TAGS, PROFILE_BIO } from "../data";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** 12px register caps — the page's standard micro-label size. */
const CAPS_MD = "font-label-md text-label-md font-semibold tracking-[0.08em] uppercase";

/** Cultural-focus chips: hairline squares, lift one step on hover. */
const TAG_CHIP = cn(
  "rounded-md border border-outline-variant px-2.5 py-1 font-label-md text-label-md text-on-surface",
  "transition-colors duration-300 hover:border-outline-hover hover:bg-surface-low",
  EASE,
);

/** 03 — Bio in the active locale, then the cultural register. */
export function BioCard() {
  const t = useTranslations("Profile.bio");
  const locale = useLocale();
  const tTags = useTranslations("Profile.tags");

  return (
    <section>
      <SectionHead index="03" title={t("title")} />

      <div className="mt-space-md space-y-space-md">
        <p className="max-w-[62ch] font-body-md text-body-md leading-relaxed text-on-surface">
          {PROFILE_BIO[locale === "es" ? "es" : "en"]}
        </p>

        <div className="space-y-space-xs border-t border-outline-variant pt-space-sm">
          <span className={cn("block text-text-muted", CAPS_MD)}>{t("culturalFocus")}</span>
          <div className="flex flex-wrap gap-1.5">
            {CULTURAL_TAGS.map((tag) => (
              <span key={tag} className={TAG_CHIP}>
                {tTags(tag)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
