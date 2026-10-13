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
import { SectionHead } from "./section-head";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Square-edged status stamp: outline when active, muted when not. */
const STAMP_ACTIVE =
  "rounded-md border border-success-border px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] uppercase text-success-text";
const STAMP_IDLE =
  "rounded-md border border-outline-variant px-2 py-0.5 font-label-md text-label-md font-semibold tracking-[0.08em] uppercase text-text-muted";

/** Register row: hairline box, square corners, one step of hover. */
const ROW = cn(
  "flex items-center justify-between gap-space-sm rounded-md border border-outline-variant bg-surface-low px-space-sm py-2",
  "transition-colors duration-300 hover:border-outline-hover",
  EASE,
);

const INITIAL_RULES = Object.fromEntries(
  PROTOCOL_RULES.map((rule) => [rule.id, rule.defaultOn]),
) as Record<ProtocolRuleId, boolean>;

/** 04 — Contact locker as a vault register: handles, protocol rules, unveils. */
export function ContactLocker() {
  const t = useTranslations("Profile.locker");
  const format = useFormatter();
  const [rules, setRules] = useState(INITIAL_RULES);
  const [revoked, setRevoked] = useState<string[]>([]);

  const unveiled = UNVEILED_MEMBERS.filter((member) => !revoked.includes(member.id));

  const relative = (daysAgo: number) => format.relativeTime(daysAgoDate(daysAgo), DEMO_NOW_DATE);

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

      {/* Handle register */}
      <div className="mt-space-md space-y-1.5">
        {LOCKER_HANDLES.map((handle) => {
          const shielded = handle.status === "shielded";
          return (
            <div key={handle.id} className={ROW}>
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
              <span className={cn("shrink-0", shielded ? STAMP_ACTIVE : STAMP_IDLE)}>
                {t(`status.${handle.status}`)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Protocol rules */}
      <div className="mt-space-md space-y-1 border-t border-outline-variant pt-space-sm">
        <span className="mb-1 block font-label-md text-label-md font-semibold tracking-[0.08em] text-text-muted uppercase">
          {t("rulesTitle")}
        </span>
        {PROTOCOL_RULES.map((rule) => (
          <label
            key={rule.id}
            className="flex cursor-pointer items-center justify-between gap-space-sm rounded-md px-1 py-2 transition-colors duration-300 hover:bg-surface-low"
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
              <span className="relative h-6 w-10 rounded-sm border border-outline-variant bg-surface-container-highest transition-colors duration-300 peer-checked:border-success-strong peer-checked:bg-success-strong peer-focus-visible:ring-2 peer-focus-visible:ring-success-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background after:absolute after:top-[3px] after:left-[3px] after:h-[18px] after:w-[18px] after:rounded-[2px] after:bg-text-muted after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.32,0.72,0,1)] after:content-[''] peer-checked:after:translate-x-4 peer-checked:after:bg-on-primary motion-reduce:after:transition-none" />
            </span>
          </label>
        ))}
      </div>

      {/* Currently unveiled members */}
      <div className="mt-space-md space-y-space-xs border-t border-outline-variant pt-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <span className="font-label-md text-label-md font-semibold text-text-muted tabular-nums">
            {t("unveiledTitle", { shown: unveiled.length, total: PROFILE_TOTALS.circles })}
          </span>
          <div className="flex items-center gap-space-sm">
            {revoked.length > 0 ? (
              <span className="font-label-md text-label-md text-success-text">{t("revoked")}</span>
            ) : null}
            <Link
              href="/connections"
              className="inline-flex min-h-11 items-center rounded-md px-3 font-label-md text-label-md text-primary transition-colors duration-300 hover:bg-surface-low focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t("manageAll")}
            </Link>
          </div>
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
                    "inline-flex min-h-11 shrink-0 items-center rounded-md border border-outline-variant px-3 font-label-md text-label-md text-text-muted",
                    "transition-colors duration-300 hover:border-danger/60 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
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
    </section>
  );
}
