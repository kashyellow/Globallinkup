"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const CAPS_MD = "font-label-md text-label-md font-semibold tracking-[0.08em] uppercase";

const TAG_CHIP = cn(
  "rounded-md border border-outline-variant px-2.5 py-1 font-label-md text-label-md text-on-surface",
  "transition-colors duration-300 hover:border-outline-hover hover:bg-surface-low",
  EASE,
);

/** 03 — Bio plus the cultural register (the member's interests). */
export function BioCard({ bio, interests }: { bio: string; interests: string[] }) {
  const t = useTranslations("Profile.bio");
  const tDiscover = useTranslations("Discover");

  return (
    <section>
      <SectionHead index="03" title={t("title")} />

      <div className="mt-space-md space-y-space-md">
        <p className="max-w-[62ch] font-body-md text-body-md leading-relaxed text-on-surface">
          {bio}
        </p>

        {interests.length > 0 ? (
          <div className="space-y-space-xs border-t border-outline-variant pt-space-sm">
            <span className={cn("block text-text-muted", CAPS_MD)}>{t("culturalFocus")}</span>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((interest) => (
                <span key={interest} className={TAG_CHIP}>
                  {tDiscover.has(`interests.${interest}`)
                    ? tDiscover(`interests.${interest}`)
                    : interest}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
