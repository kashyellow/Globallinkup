"use client";

import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ADMIN_USERS, type AdminUser } from "../data";

const ACTION_BASE =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";

export function AdminUsersTab() {
  const t = useTranslations("Admin.users");

  return (
    <div className="flex flex-col gap-space-lg">
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
          <div className="flex items-center gap-space-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-admin-border bg-admin-surface text-primary">
              <Icon name="verified_user" />
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {t("title")}
              </h2>
              <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{t("body")}</p>
            </div>
          </div>

          <label className="flex items-center gap-space-sm">
            <span className="font-label-md text-label-md text-secondary">{t("filterLabel")}</span>
            <select className="h-11 rounded-full border border-outline-variant bg-surface-dim px-space-md font-label-md text-label-md text-on-surface transition-colors duration-300 hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              <option>{t("filterAll")}</option>
              <option>{t("filterPhoto")}</option>
              <option>{t("filterVerifiedToday")}</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-space-md">
        {ADMIN_USERS.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}

function UserCard({ user }: { user: AdminUser }) {
  const t = useTranslations("Admin.users");

  const chipTone =
    user.status === "flagged"
      ? "border-danger-border bg-danger-surface text-danger-text"
      : user.status === "approved"
        ? "border-success-border bg-success-surface text-success-text"
        : "border-outline-variant bg-surface-container text-secondary";

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <article className="flex flex-col items-start justify-between gap-space-lg bezel-core p-space-lg lg:flex-row lg:items-center">
        <div className="flex w-full flex-col items-start gap-space-md sm:flex-row sm:items-center lg:w-auto">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={user.avatarAlt}
              className="h-24 w-20 rounded-2xl border border-outline-variant object-cover"
              src={user.avatar}
              loading="lazy"
            />
            <span
              className={cn(
                "absolute -right-2 -bottom-2 rounded-full border px-2 py-0.5 font-label-md text-label-md font-semibold",
                chipTone,
              )}
            >
              {user.chipKey ? t(user.chipKey) : user.langBadge}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-2">
              <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {user.name}
              </h3>
              <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary">
                <Icon name="location_on" className="text-sm" />
                {user.location}
              </span>
              {user.status === "pending" && user.registeredTime ? (
                <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-secondary">
                  {t("registeredAgo", { time: user.registeredTime })}
                </span>
              ) : null}
              {user.status === "flagged" ? (
                <span className="rounded-full border border-danger-border bg-danger-surface px-2.5 py-0.5 font-label-md text-label-md text-danger-text">
                  {t("lowLighting")}
                </span>
              ) : null}
              {user.status === "approved" ? (
                <span className="rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-success-text">
                  {t("verifiedActiveMember")}
                </span>
              ) : null}
            </div>

            <p className="max-w-xl font-body-sm text-body-sm text-text-muted">{user.bio}</p>

            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1 pt-1">
              {user.meta.map((item, index) => (
                <span key={item.key} className="flex items-center gap-space-sm">
                  {index > 0 ? <span className="text-outline-variant">·</span> : null}
                  <MetaChip metaKey={item.key} tone={item.tone} />
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm lg:w-auto lg:shrink-0 lg:flex-nowrap lg:border-t-0 lg:pt-0">
          {user.status === "approved" ? (
            <>
              <span className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md whitespace-nowrap text-secondary">
                <Icon name="check_circle" className="text-base text-success-text" />
                {t("publishedToDiscover")}
              </span>
              <button
                type="button"
                className={cn(
                  ACTION_BASE,
                  "border border-outline-variant text-secondary hover:border-danger-border-strong/60 hover:text-danger focus-visible:outline-danger-border-strong",
                )}
              >
                {t("revoke")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={cn(
                  ACTION_BASE,
                  "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container focus-visible:outline-primary",
                )}
              >
                {user.status === "flagged" ? t("requestPhoto") : t("inspectDossier")}
              </button>
              <button
                type="button"
                className={cn(
                  ACTION_BASE,
                  "border border-danger-border bg-danger-surface text-danger-text hover:border-danger-border-strong/60 focus-visible:outline-danger-border-strong",
                )}
              >
                <Icon name="close" className="text-base" />
                {t("reject")}
              </button>
              <button
                type="button"
                className={cn(
                  ACTION_BASE,
                  "border border-success-ring/30 bg-success-strong text-white hover:bg-success-hover focus-visible:outline-success-ring",
                )}
              >
                <Icon name="check" className="text-base" />
                {user.status === "flagged" ? t("approveAnyway") : t("approveProfile")}
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

function MetaChip({ metaKey, tone }: { metaKey: string; tone: "ok" | "warn" | "neutral" }) {
  const t = useTranslations("Admin.users");
  const valueTone = tone === "warn" ? "text-danger-text" : "text-success-text";

  if (metaKey === "phoneVerified") {
    return (
      <span className="font-label-md text-label-md text-secondary">
        {t("phoneVerified")} <span className={valueTone}>{t("yes")}</span>
      </span>
    );
  }
  if (metaKey === "photoIntegrity") {
    return (
      <span className="font-label-md text-label-md text-secondary">
        {t("photoIntegrity")} <span className={valueTone}>{t("photoIntegrityHigh")}</span>
      </span>
    );
  }
  if (metaKey === "instagramSynced") {
    return (
      <span className="font-label-md text-label-md text-secondary">
        {t("instagramSynced")} <span className={valueTone}>{t("verified")}</span>
      </span>
    );
  }
  if (metaKey === "needsClearFace") {
    return (
      <span className="font-label-md text-label-md text-danger-text">{t("needsClearFace")}</span>
    );
  }
  return (
    <span className="font-label-md text-label-md text-success-text">{t("identityConfirmed")}</span>
  );
}
