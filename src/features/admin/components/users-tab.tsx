"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { reviewPersonaAction } from "@/features/admin/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AdminProfileDto } from "../queries";

const ACTION_BASE =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px";

const STATUS_KEY: Record<AdminProfileDto["status"], string> = {
  pending: "statusPending",
  approved: "statusApproved",
  rejected: "statusRejected",
  suspended: "statusSuspended",
};

export function AdminUsersTab({ users }: { users: AdminProfileDto[] }) {
  const t = useTranslations("Admin.users");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const visible =
    needle.length === 0
      ? users
      : users.filter((user) =>
          [user.name, user.location, user.headline, user.bio, user.languages]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(needle),
        );

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuery(draft.trim());
  }

  function clearSearch() {
    setDraft("");
    setQuery("");
  }

  return (
    <div className="flex flex-col gap-space-lg">
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <form
          onSubmit={search}
          className="flex flex-col gap-space-sm bezel-core p-space-md sm:flex-row sm:items-center"
        >
          <div className="relative flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-lg text-secondary"
            />
            <label htmlFor="admin-user-search" className="sr-only">
              {t("searchLabel")}
            </label>
            <input
              id="admin-user-search"
              type="search"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-full border border-outline-variant bg-surface-dim pr-4 pl-11 font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>
          <button
            type="submit"
            className={cn(
              ACTION_BASE,
              "justify-center border border-transparent bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
            )}
          >
            <Icon name="search" className="text-base" />
            {t("searchAction")}
          </button>
        </form>
      </div>

      {query.length > 0 ? (
        <p className="px-space-xs font-label-md text-label-md text-secondary">
          {t("resultsCount", { shown: visible.length, total: users.length })}
        </p>
      ) : null}

      {visible.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon
              name={users.length === 0 ? "person_off" : "search_off"}
              className="text-3xl text-secondary"
            />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {users.length === 0 ? t("emptyTitle") : t("noResultsTitle")}
            </p>
            {users.length > 0 ? (
              <button
                type="button"
                onClick={clearSearch}
                className={cn(
                  ACTION_BASE,
                  "mt-space-xs border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-container-high focus-visible:outline-primary",
                )}
              >
                {t("clearSearch")}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-space-md">
          {visible.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user }: { user: AdminProfileDto }) {
  const t = useTranslations("Admin.users");
  const format = useFormatter();
  const router = useRouter();

  const chipTone =
    user.status === "approved"
      ? "border-success-border bg-success-surface text-success-text"
      : user.status === "pending"
        ? "border-outline-variant bg-surface-container text-secondary"
        : "border-danger-border bg-danger-surface text-danger-text";

  async function review(decision: "approved" | "rejected" | "suspended") {
    const result = await reviewPersonaAction({ profileId: user.id, decision });
    if (result.ok) router.refresh();
  }

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <article className="flex flex-col items-start justify-between gap-space-lg bezel-core p-space-lg lg:flex-row lg:items-center">
        <div className="flex w-full flex-col items-start gap-space-md sm:flex-row sm:items-center lg:w-auto">
          <div className="relative shrink-0">
            {user.avatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={user.name}
                  className="h-24 w-20 rounded-2xl border border-outline-variant object-cover"
                  src={user.avatar}
                  loading="lazy"
                />
              </>
            ) : (
              <DefaultAvatar className="h-24 w-20 rounded-2xl border border-outline-variant" />
            )}
            <span
              className={cn(
                "absolute -right-2 -bottom-2 rounded-full border px-2 py-0.5 font-label-md text-label-md font-semibold",
                chipTone,
              )}
            >
              {t(STATUS_KEY[user.status])}
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
              {user.languages ? (
                <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-secondary">
                  {user.languages}
                </span>
              ) : null}
              {user.status === "pending" && user.submittedAt ? (
                <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-secondary">
                  {t("registeredAgo", {
                    time: format.relativeTime(new Date(user.submittedAt), new Date()),
                  })}
                </span>
              ) : null}
            </div>

            {user.headline ? (
              <p className="font-label-md text-label-md text-primary">{user.headline}</p>
            ) : null}
            <p className="max-w-xl font-body-sm text-body-sm text-text-muted">{user.bio}</p>
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
                onClick={() => void review("suspended")}
                className={cn(
                  ACTION_BASE,
                  "border border-outline-variant text-secondary hover:border-danger-border-strong/60 hover:text-danger focus-visible:outline-danger-border-strong",
                )}
              >
                {t("suspend")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => void review("rejected")}
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
                onClick={() => void review("approved")}
                className={cn(
                  ACTION_BASE,
                  "border border-success-ring/30 bg-success-strong text-white hover:bg-success-hover focus-visible:outline-success-ring",
                )}
              >
                <Icon name="check" className="text-base" />
                {t("approveProfile")}
              </button>
            </>
          )}
        </div>
      </article>
    </div>
  );
}
