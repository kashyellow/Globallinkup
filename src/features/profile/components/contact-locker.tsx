"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  DEMO_NOW_DATE,
  LOCKER_HANDLES,
  PROFILE_TOTALS,
  PROTOCOL_RULES,
  UNVEILED_MEMBERS,
  daysAgoDate,
  type ProtocolRuleId,
} from "../data";

const INITIAL_RULES = Object.fromEntries(
  PROTOCOL_RULES.map((rule) => [rule.id, rule.defaultOn]),
) as Record<ProtocolRuleId, boolean>;

export function ContactLocker() {
  const t = useTranslations("Profile.locker");
  const format = useFormatter();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [revoked, setRevoked] = useState<string[]>([]);

  const unveiled = UNVEILED_MEMBERS.filter((member) => !revoked.includes(member.id));

  const relative = (daysAgo: number) => format.relativeTime(daysAgoDate(daysAgo), DEMO_NOW_DATE);

  return (
    <div className="relative space-y-space-md overflow-hidden rounded-2xl bg-surface-container p-space-lg shadow-sm">
      <div className="flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-2">
          <Icon name="lock" className="text-[20px] text-tertiary" />
          <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
            {t("title")}
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-tertiary/10 px-2 py-0.5 font-label-caps text-[10px] font-bold tracking-wider text-tertiary uppercase">
          {t("badge")}
        </span>
      </div>

      <p className="font-body-sm text-body-sm text-text-muted">{t("body")}</p>

      {/* Handles status list */}
      <div className="space-y-2 pt-1">
        {LOCKER_HANDLES.map((handle) => {
          const shielded = handle.status === "shielded";
          return (
            <div
              key={handle.id}
              className="bg-surface-container-low flex items-center justify-between gap-space-sm rounded-xl p-space-sm"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <Icon name={handle.icon} className="text-[18px] text-text-muted" />
                <div className="min-w-0">
                  <span className="block truncate font-label-md text-label-md text-on-surface">
                    {t(`handles.${handle.id}`)}
                  </span>
                  <span className="font-label-caps text-[10px] text-text-muted">
                    {handle.value ? `${handle.value} ${t("masked")}` : t("openArchive")}
                  </span>
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 font-label-caps text-[10px] font-bold",
                  shielded
                    ? "bg-tertiary text-on-tertiary"
                    : "bg-surface-container-highest text-text-muted",
                )}
              >
                {t(`status.${handle.status}`)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Protocol rules */}
      <div className="space-y-3 pt-space-sm">
        <span className="block font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
          {t("rulesTitle")}
        </span>
        {PROTOCOL_RULES.map((rule) => (
          <label
            key={rule.id}
            className="flex cursor-pointer items-center justify-between gap-space-sm py-1"
          >
            <div className="pr-2">
              <span className="block font-label-md text-label-md font-medium text-on-surface">
                {t(`rules.${rule.id}.label`)}
              </span>
              <span className="block font-body-sm text-body-sm text-text-muted">
                {t(`rules.${rule.id}.body`)}
              </span>
            </div>
            <span className="relative inline-flex shrink-0 items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={rules[rule.id]}
                onChange={(event) =>
                  setRules((prev) => ({ ...prev, [rule.id]: event.target.checked }))
                }
              />
              <span className="relative h-6 w-10 rounded-full bg-surface-container-highest transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary-container after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-4" />
            </span>
          </label>
        ))}
      </div>

      {/* Currently unveiled members */}
      <div className="space-y-space-xs pt-space-sm">
        <div className="flex items-center justify-between gap-space-sm">
          <span className="font-label-caps text-label-caps tracking-wider text-text-muted uppercase">
            {t("unveiledTitle", { shown: unveiled.length, total: PROFILE_TOTALS.circles })}
          </span>
          <div className="flex items-center gap-space-sm">
            {revoked.length > 0 ? (
              <span className="font-label-caps text-label-caps text-tertiary">{t("revoked")}</span>
            ) : null}
            <Link
              href="/connections"
              className="inline-flex min-h-8 items-center font-label-md text-label-md text-primary hover:underline"
            >
              {t("manageAll")}
            </Link>
          </div>
        </div>

        <div className="space-y-1.5">
          {unveiled.map((member) => (
            <div
              key={member.id}
              className="bg-surface-container-low flex items-center justify-between gap-space-sm rounded-xl p-2 transition-colors hover:bg-surface-container-high"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-label-caps font-bold text-on-surface">
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-label-md text-label-md text-on-surface">
                    {member.name}
                  </span>
                  <span className="font-label-caps text-[10px] text-text-muted">
                    {member.city} • {t("unlocked", { time: relative(member.unlockedDaysAgo ?? 0) })}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRevoked((prev) => [...prev, member.id])}
                className="inline-flex min-h-10 shrink-0 items-center px-2 font-label-caps text-label-caps tracking-wider text-text-muted uppercase transition-colors hover:text-error"
              >
                {t("revoke")}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
