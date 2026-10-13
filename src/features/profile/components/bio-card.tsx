"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
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

/** 03 — Bilingual bio: two editions stacked, then the cultural register. */
export function BioCard() {
  const t = useTranslations("Profile.bio");
  const tTags = useTranslations("Profile.tags");

  return (
    <section>
      <SectionHead index="03" title={t("title")}>
        <span
          className={cn(
            "flex items-center gap-1.5 border border-success-border px-2 py-0.5 text-success-text",
            CAPS_MD,
          )}
        >
          <Icon name="translate" className="text-sm" />
          {t("autoMirrored")}
        </span>
      </SectionHead>

      <div className="mt-space-md space-y-space-md">
        <div className="space-y-1">
          <span className={cn("text-primary", CAPS_MD)}>{t("english")}</span>
          <p className="max-w-[62ch] font-body-md text-body-md leading-relaxed text-on-surface">
            {PROFILE_BIO.en}
          </p>
        </div>

        <div className="space-y-1 border-t border-outline-variant pt-space-sm">
          <span className={cn("text-secondary", CAPS_MD)}>{t("spanish")}</span>
          <p className="max-w-[62ch] font-body-sm text-body-sm leading-relaxed text-text-muted italic">
            {PROFILE_BIO.es}
          </p>
        </div>

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
