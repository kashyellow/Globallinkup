"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ADMIN_USERS, type AdminUser } from "../data";

export function AdminUsersTab() {
  const t = useTranslations("Admin.users");

  return (
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-md sm:flex-row sm:items-center">
        <div className="flex items-center gap-space-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-admin-border bg-admin-surface text-primary">
            <Icon name="verified_user" />
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{t("title")}</h2>
            <p className="font-body-sm text-body-sm text-secondary">{t("body")}</p>
          </div>
        </div>

        <div className="flex items-center gap-space-sm">
          <span className="font-label-caps text-label-caps text-secondary uppercase">
            {t("filterLabel")}
          </span>
          <select className="rounded-lg border border-outline-variant bg-surface-dim px-3 py-1.5 font-label-md text-label-md text-on-surface focus:ring-1 focus:ring-primary-container focus:outline-none">
            <option>{t("filterAll")}</option>
            <option>{t("filterPhoto")}</option>
            <option>{t("filterVerifiedToday")}</option>
          </select>
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

  return (
    <article className="flex flex-col items-start justify-between gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg transition-all hover:border-outline-hover lg:flex-row lg:items-center">
      <div className="flex w-full flex-col items-start gap-space-md sm:flex-row sm:items-center lg:w-auto">
        <div className="relative shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={user.avatarAlt}
            className="h-24 w-20 rounded-lg border border-outline-variant object-cover"
            src={user.avatar}
            loading="lazy"
          />
          <span
            className={cn(
              "absolute -right-2 -bottom-2 rounded px-1.5 py-0.5 font-label-caps text-label-caps",
              user.status === "pending" &&
                "border border-outline-variant bg-surface-container text-secondary",
              user.status === "flagged" &&
                "border border-danger-border bg-danger-surface text-on-error-container",
              user.status === "approved" &&
                "border border-success-border bg-success-container text-success-text-bright",
            )}
          >
            {user.chipKey ? t(user.chipKey) : user.langBadge}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-space-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">{user.name}</h3>
            <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary">
              <Icon name="location_on" className="text-sm" />
              {user.location}
            </span>
            {user.status === "pending" && user.registeredTime ? (
              <span className="rounded border border-outline-variant bg-surface-container px-2 py-0.5 font-label-caps text-label-caps text-secondary">
                {t("registeredAgo", { time: user.registeredTime })}
              </span>
            ) : null}
            {user.status === "flagged" ? (
              <span className="rounded border border-danger-border bg-danger-surface/70 px-2 py-0.5 font-label-caps text-label-caps text-on-error-container">
                {t("lowLighting")}
              </span>
            ) : null}
            {user.status === "approved" ? (
              <span className="rounded border border-success-border bg-success-container/70 px-2 py-0.5 font-label-caps text-label-caps font-semibold text-success-text-bright">
                {t("verifiedActiveMember")}
              </span>
            ) : null}
          </div>

          <p className="max-w-xl font-body-sm text-body-sm text-on-surface-muted">{user.bio}</p>

          <div className="flex flex-wrap items-center gap-space-sm pt-1">
            {user.meta.map((item, index) => (
              <span key={item.key} className="flex items-center gap-space-sm">
                {index > 0 ? <span className="text-outline-variant">·</span> : null}
                <MetaChip metaKey={item.key} tone={item.tone} />
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-space-sm border-t border-outline-variant pt-space-sm lg:w-auto lg:border-t-0 lg:pt-0">
        {user.status === "approved" ? (
          <>
            <span className="flex min-h-10 items-center gap-1 rounded border border-outline-variant bg-surface-dim px-3 py-1.5 font-label-md text-label-md text-secondary">
              <Icon name="check_circle" className="text-base text-success-bright" />
              {t("publishedToDiscover")}
            </span>
            <button
              type="button"
              className="min-h-10 rounded-lg border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-secondary transition-colors hover:border-danger/60 hover:text-danger"
            >
              {t("revoke")}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="min-h-10 rounded-lg border border-outline-variant bg-surface-dim px-3 py-2 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container"
            >
              {user.status === "flagged" ? t("requestPhoto") : t("inspectDossier")}
            </button>
            <button
              type="button"
              className="flex min-h-10 items-center gap-1 rounded-lg border border-danger-border-strong/50 bg-danger-surface/50 px-4 py-2 font-label-md text-label-md text-admin-text transition-colors hover:bg-danger-surface"
            >
              <Icon name="close" className="text-base" />
              {t("reject")}
            </button>
            <button
              type="button"
              className="flex min-h-10 items-center gap-1 rounded-lg border border-success-ring/30 bg-success-strong px-4 py-2 font-label-md text-label-md text-white shadow-sm transition-all hover:bg-[#005232]"
            >
              <Icon name="check" className="text-base" />
              {user.status === "flagged" ? t("approveAnyway") : t("approveProfile")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function MetaChip({ metaKey, tone }: { metaKey: string; tone: "ok" | "warn" | "neutral" }) {
  const t = useTranslations("Admin.users");
  const valueTone = tone === "warn" ? "text-danger" : "text-success-bright";

  if (metaKey === "phoneVerified") {
    return (
      <span className="font-label-caps text-label-caps text-secondary uppercase">
        {t("phoneVerified")} <span className={valueTone}>{t("yes")}</span>
      </span>
    );
  }
  if (metaKey === "photoIntegrity") {
    return (
      <span className="font-label-caps text-label-caps text-secondary uppercase">
        {t("photoIntegrity")} <span className={valueTone}>{t("photoIntegrityHigh")}</span>
      </span>
    );
  }
  if (metaKey === "instagramSynced") {
    return (
      <span className="font-label-caps text-label-caps text-secondary uppercase">
        {t("instagramSynced")} <span className={valueTone}>{t("verified")}</span>
      </span>
    );
  }
  if (metaKey === "needsClearFace") {
    return (
      <span className="font-label-caps text-label-caps text-danger uppercase">
        {t("needsClearFace")}
      </span>
    );
  }
  return (
    <span className="font-label-caps text-label-caps text-success-bright uppercase">
      {t("identityConfirmed")}
    </span>
  );
}
