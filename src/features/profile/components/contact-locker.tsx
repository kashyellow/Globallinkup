"use client";

import type { CSSProperties } from "react";
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

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

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
    <section className="bezel-tray">
      <div
        className="space-y-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-success-border bg-success-surface">
              <Icon name="lock" className="text-base text-success-text" />
            </span>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {t("title")}
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold text-success-text">
            {t("badge")}
          </span>
        </div>

        <p className="font-body-sm text-body-sm text-text-muted">{t("body")}</p>

        {/* Handle status list */}
        <div className="space-y-1.5">
          {LOCKER_HANDLES.map((handle) => {
            const shielded = handle.status === "shielded";
            return (
              <div
                key={handle.id}
                className="flex items-center justify-between gap-space-sm rounded-2xl bg-surface-low p-space-sm"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <Icon name={handle.icon} className="shrink-0 text-lg text-text-muted" />
                  <div className="min-w-0">
                    <span className="block truncate font-label-md text-label-md text-on-surface">
                      {t(`handles.${handle.id}`)}
                    </span>
                    <span className="font-label-md text-label-md text-text-muted">
                      {handle.value ? `${handle.value} ${t("masked")}` : t("openArchive")}
                    </span>
                  </div>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 font-label-md text-label-md font-semibold",
                    shielded
                      ? "bg-success-surface text-success-text"
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
        <div className="space-y-1 border-t border-outline-variant pt-space-sm">
          <span className="mb-1 block font-label-md text-label-md font-semibold text-text-muted">
            {t("rulesTitle")}
          </span>
          {PROTOCOL_RULES.map((rule) => (
            <label
              key={rule.id}
              className="flex cursor-pointer items-center justify-between gap-space-sm rounded-2xl px-1 py-2 transition-colors duration-300 hover:bg-surface-low"
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
                <span className="relative h-6 w-10 rounded-full bg-surface-container-highest transition-colors duration-300 peer-checked:bg-success-strong peer-focus-visible:ring-2 peer-focus-visible:ring-success-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-surface-container after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-surface-lowest after:transition-transform after:content-[''] peer-checked:after:translate-x-4 motion-reduce:after:transition-none" />
              </span>
            </label>
          ))}
        </div>

        {/* Currently unveiled members */}
        <div className="space-y-space-xs border-t border-outline-variant pt-space-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <span className="font-label-md text-label-md font-semibold text-text-muted tabular-nums">
              {t("unveiledTitle", { shown: unveiled.length, total: PROFILE_TOTALS.circles })}
            </span>
            <div className="flex items-center gap-space-sm">
              {revoked.length > 0 ? (
                <span className="font-label-md text-label-md text-success-text">
                  {t("revoked")}
                </span>
              ) : null}
              <Link
                href="/connections"
                className="inline-flex min-h-11 items-center rounded-full px-3 font-label-md text-label-md text-primary transition-colors duration-300 hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("manageAll")}
              </Link>
            </div>
          </div>

          {unveiled.length === 0 ? (
            <p className="rounded-2xl bg-surface-low p-space-sm text-center font-body-sm text-body-sm text-text-muted">
              {t("allRevoked")}
            </p>
          ) : (
            <div className="space-y-1.5">
              {unveiled.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-space-sm rounded-2xl bg-surface-low p-2 transition-colors duration-300 hover:bg-surface-container-high"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-highest font-label-md font-bold text-on-surface">
                      {member.initials}
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate font-label-md text-label-md text-on-surface">
                        {member.name}
                      </span>
                      <span className="font-label-md text-label-md text-text-muted">
                        {member.city} •{" "}
                        {t("unlocked", { time: relative(member.unlockedDaysAgo ?? 0) })}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevoked((prev) => [...prev, member.id])}
                    className={cn(
                      "inline-flex min-h-11 shrink-0 items-center rounded-full px-3 font-label-md text-label-md text-text-muted",
                      "hover:bg-surface-container-highest hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      "transition-colors duration-300",
                      EASE,
                    )}
                  >
                    {t("revoke")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
