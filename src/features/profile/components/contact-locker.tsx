"use client";

import { useFormatter, useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { OwnProfile, ProfileChannel } from "../queries";
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

const STAMP_ACTIVE =
  "rounded-md border border-success-border px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] uppercase text-success-text";

const ROW = cn(
  "flex items-center justify-between gap-space-sm rounded-md border border-outline-variant bg-surface-low px-space-sm py-2",
  "transition-colors duration-300 hover:border-outline-hover",
  EASE,
);

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: "chat",
  telegram: "send",
  instagram: "photo_camera",
  facebook: "public",
  tiktok: "music_note",
  x: "tag",
};

/** 04 — Contact locker: the member's own channels and who can see them. */
export function ContactLocker({
  channels,
  unveiled,
}: {
  channels: ProfileChannel[];
  unveiled: OwnProfile["unveiled"];
}) {
  const t = useTranslations("Profile.locker");
  const tChannels = useTranslations("Connections.active");
  const format = useFormatter();

  return (
    <section>
      <SectionHead index="04" title={t("title")}>
        <span className="border border-primary px-2 py-0.5 font-label-md text-label-md font-bold tracking-[0.08em] text-primary uppercase">
          {t("badge")}
        </span>
      </SectionHead>

      <p className="mt-space-md max-w-[62ch] font-body-sm text-body-sm text-text-muted">
        {t("body")}
      </p>

      <div className="mt-space-md space-y-1.5">
        {channels.length === 0 ? (
          <p className="rounded-md border border-outline-variant p-space-sm text-center font-body-sm text-body-sm text-text-muted">
            {t("allRevoked")}
          </p>
        ) : (
          channels.map((channel) => (
            <div key={channel.key} className={ROW}>
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon
                  name={CHANNEL_ICONS[channel.key] ?? "link"}
                  className="shrink-0 text-lg text-text-muted"
                />
                <div className="min-w-0">
                  <span className="block truncate font-label-md text-label-md text-on-surface">
                    {tChannels.has(`channels.${channel.key}`)
                      ? tChannels(`channels.${channel.key}`)
                      : channel.key}
                  </span>
                  <span className="font-label-md text-label-md text-text-muted">
                    {channel.value}
                  </span>
                </div>
              </div>
              <span className={cn("shrink-0", STAMP_ACTIVE)}>{t("status.shielded")}</span>
            </div>
          ))
        )}
      </div>

      {/* Currently unveiled members (accepted connections). */}
      <div className="mt-space-md space-y-space-xs border-t border-outline-variant pt-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <span className="font-label-md text-label-md font-semibold text-text-muted tabular-nums">
            {t("unveiledTitle", { shown: unveiled.length, total: unveiled.length })}
          </span>
          <Link
            href="/connections"
            className="inline-flex min-h-11 items-center rounded-md px-3 font-label-md text-label-md text-primary transition-colors duration-300 hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t("manageAll")}
          </Link>
        </div>

        {unveiled.length === 0 ? (
          <p className="rounded-md border border-outline-variant p-space-sm text-center font-body-sm text-body-sm text-text-muted">
            {t("allRevoked")}
          </p>
        ) : (
          <div className="space-y-1.5">
            {unveiled.map((member) => (
              <div key={member.id} className={ROW}>
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-container-highest font-label-md font-bold text-on-surface">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <span className="block truncate font-label-md text-label-md text-on-surface">
                      {member.name}
                    </span>
                    <span className="font-label-md text-label-md text-text-muted">
                      {member.city} •{" "}
                      {t("unlocked", {
                        time: member.unlockedAt
                          ? format.relativeTime(new Date(member.unlockedAt), new Date())
                          : "",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
