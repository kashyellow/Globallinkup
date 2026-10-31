"use client";

import { useRef, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import type { DeskAccess } from "@/features/admin/desks";
import {
  createSubAdminAction,
  removeSubAdminAction,
  updateSubAdminAction,
} from "@/features/admin/team-actions";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";

const FIELD =
  "h-11 w-full min-w-0 rounded-xl border border-outline-variant bg-surface-dim px-3 font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const LABEL = "font-label-md text-label-md font-semibold text-on-surface";
const PRIMARY =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60";
const SECONDARY =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md whitespace-nowrap text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60";
const DANGER =
  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-danger-border px-4 font-label-md text-label-md whitespace-nowrap text-danger-text transition-colors hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60";

const DESKS = [
  { key: "members", icon: "how_to_reg" },
  { key: "moderation", icon: "gavel" },
  { key: "marketplace", icon: "storefront" },
] as const;

const NO_ACCESS: DeskAccess = { members: false, moderation: false, marketplace: false };

export type TeamAdmin = {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  access: DeskAccess;
};

type Credentials = { email: string; password: string };

/** Every mutation below refreshes the route, or the desk shows stale props. */
export function TeamView({ admins }: { admins: TeamAdmin[] }) {
  const t = useTranslations("Admin.team");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const owners = admins.filter((admin) => admin.isOwner);
  const subAdmins = admins.filter((admin) => !admin.isOwner);

  // `undefined` = closed, `null` = creating, an admin = editing that admin.
  const [editing, setEditing] = useState<TeamAdmin | null | undefined>(undefined);
  const [removeTarget, setRemoveTarget] = useState<TeamAdmin | null>(null);
  const [created, setCreated] = useState<Credentials | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(admin: TeamAdmin) {
    const formData = new FormData();
    formData.set("profileId", admin.id);
    setError(null);
    const ok = await run(`remove:${admin.id}`, async () => {
      const result = await removeSubAdminAction(formData);
      if (!result.ok) {
        setError(result.error ?? "unknown");
        return false;
      }
      refresh();
      return true;
    });
    if (ok) setRemoveTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-space-lg pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <AdminPageHeader
        title={t("title")}
        description={t("body")}
        meta={t("subAdminCount", { count: subAdmins.length })}
        action={
          <button
            type="button"
            onClick={() => setEditing(null)}
            aria-label={t("add")}
            className="inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-primary font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px sm:px-5"
          >
            <Icon name="person_add" className="text-xl" />
            <span className="hidden sm:inline">{t("add")}</span>
          </button>
        }
      />

      {error ? (
        <InlineAlert className="mt-space-md">{t(`errors.${error}` as never)}</InlineAlert>
      ) : null}

      <section aria-labelledby="team-sub-admins" className="mt-space-lg">
        <h2
          id="team-sub-admins"
          className="font-label-lg text-label-lg font-semibold tracking-wide text-secondary uppercase"
        >
          {t("subAdminsTitle")}
        </h2>

        {subAdmins.length === 0 ? (
          <div className="mt-space-sm flex flex-col items-center gap-space-sm rounded-2xl border border-dashed border-outline-variant bg-surface-low px-space-md py-space-xl text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-admin-surface text-admin-text">
              <Icon name="group" className="text-2xl" />
            </span>
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("noSubAdmins")}
            </p>
            <p className="max-w-[40ch] font-body-sm text-body-sm text-secondary">
              {t("noSubAdminsBody")}
            </p>
            <button type="button" onClick={() => setEditing(null)} className={PRIMARY}>
              <Icon name="person_add" className="text-xl" />
              {t("add")}
            </button>
          </div>
        ) : (
          <ul className="mt-space-sm flex flex-col gap-space-sm">
            {subAdmins.map((admin) => (
              <SubAdminRow
                key={admin.id}
                admin={admin}
                onEdit={() => setEditing(admin)}
                onRemove={() => setRemoveTarget(admin)}
              />
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="team-owners"
        className="mt-space-lg rounded-2xl border border-outline-variant bg-surface-low p-space-md"
      >
        <div className="flex items-start gap-space-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-admin-surface text-admin-text">
            <Icon name="verified_user" className="text-lg" />
          </span>
          <div className="min-w-0">
            <h2
              id="team-owners"
              className="font-label-lg text-label-lg font-semibold text-on-surface"
            >
              {t("ownersTitle")}
            </h2>
            <p className="font-body-sm text-body-sm text-secondary">{t("ownerHint")}</p>
          </div>
        </div>
        <ul className="mt-space-sm flex flex-wrap gap-2">
          {owners.map((owner) => (
            <li
              key={owner.id}
              className="max-w-full truncate rounded-full border border-admin-border bg-admin-surface px-3 py-1 font-label-md text-label-md text-admin-text"
            >
              {owner.name}
            </li>
          ))}
        </ul>
      </section>

      {editing !== undefined ? (
        <SubAdminDialog
          // Remount per target so the fields start from that admin's values.
          key={editing?.id ?? "new"}
          admin={editing}
          onClose={() => setEditing(undefined)}
          onCreated={(credentials) => {
            setEditing(undefined);
            setCreated(credentials);
            refresh();
          }}
          onSaved={() => {
            setEditing(undefined);
            refresh();
          }}
        />
      ) : null}

      {created ? (
        <CredentialsDialog credentials={created} onClose={() => setCreated(null)} />
      ) : null}

      <ConfirmDialog
        open={removeTarget !== null}
        title={t("removeTitle", { name: removeTarget?.name ?? "" })}
        body={t("removeHint")}
        confirmLabel={t("confirmRemove")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={t("working")}
        pending={removeTarget ? isPending(`remove:${removeTarget.id}`) : false}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => {
          if (removeTarget) void remove(removeTarget);
        }}
      />
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function SubAdminRow({
  admin,
  onEdit,
  onRemove,
}: {
  admin: TeamAdmin;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const t = useTranslations("Admin.team");
  const desks = DESKS.filter((desk) => admin.access[desk.key]);

  return (
    <li className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-md md:flex-row md:items-center md:gap-space-md">
      <div className="flex min-w-0 flex-1 items-start gap-space-sm">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-admin-surface font-label-lg text-label-lg font-semibold text-admin-text"
        >
          {initials(admin.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
            {admin.name}
          </p>
          <p className="truncate font-body-sm text-body-sm text-secondary" title={admin.email}>
            {admin.email}
          </p>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t("desksLabel")}>
            {desks.length === 0 ? (
              <li className="rounded-full border border-outline-variant px-2.5 py-0.5 font-label-md text-label-md text-text-muted">
                {t("noAccess")}
              </li>
            ) : (
              desks.map((desk) => (
                <li
                  key={desk.key}
                  className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container px-2.5 py-0.5 font-label-md text-label-md text-on-surface"
                >
                  <Icon name={desk.icon} className="text-sm text-primary" />
                  {t(`${desk.key}.label`)}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Phones: two equal buttons under the details; from md they sit on the right. */}
      <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`${t("edit")}: ${admin.name}`}
          className={SECONDARY}
        >
          <Icon name="edit" className="text-lg" />
          {t("edit")}
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`${t("remove")}: ${admin.name}`}
          className={DANGER}
        >
          <Icon name="delete" className="text-lg" />
          {t("remove")}
        </button>
      </div>
    </li>
  );
}

const LOWER = "abcdefghijkmnopqrstuvwxyz";
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const DIGITS = "23456789";

/** Random, with at least one lowercase, uppercase and digit to meet the policy. */
function generatePassword(length = 14) {
  const pick = (set: string, value: number) => set[value % set.length];
  const random = crypto.getRandomValues(new Uint32Array(length));
  const chars = Array.from(random, (value) => pick(LOWER + UPPER + DIGITS, value));
  chars[0] = pick(LOWER, random[0]);
  chars[1] = pick(UPPER, random[1]);
  chars[2] = pick(DIGITS, random[2]);
  // Shuffle so the guaranteed characters are not always first.
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = crypto.getRandomValues(new Uint32Array(1))[0] % (index + 1);
    [chars[index], chars[swap]] = [chars[swap], chars[index]];
  }
  return chars.join("");
}

/**
 * Create and edit share one sheet: a bottom sheet on phones, a centred dialog
 * from `sm`. The footer stays pinned so Save is reachable above the keyboard.
 */
function SubAdminDialog({
  admin,
  onClose,
  onCreated,
  onSaved,
}: {
  admin: TeamAdmin | null;
  onClose: () => void;
  onCreated: (credentials: Credentials) => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Admin.team");
  const tCommon = useTranslations("Common");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(admin === null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const containerRef = useDialogA11y(
    true,
    () => {
      if (!busy) onClose();
    },
    firstFieldRef,
  );
  const editing = admin !== null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const formData = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      if (editing) {
        formData.set("profileId", admin.id);
        const result = await updateSubAdminAction(formData);
        if (!result.ok) {
          setError(result.error ?? "unknown");
          return;
        }
        onSaved();
      } else {
        const result = await createSubAdminAction({ ok: false }, formData);
        if (!result.ok) {
          setError(result.error ?? "unknown");
          return;
        }
        onCreated({
          email: String(formData.get("email") ?? "").trim(),
          password: String(formData.get("password") ?? ""),
        });
      }
    } catch {
      setError("unknown");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-space-lg"
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-dialog-title"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg sm:rounded-[1.5rem]"
      >
        {/* Grab handle: a visual cue that this is a sheet on phones. */}
        <span
          aria-hidden="true"
          className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-outline-variant sm:hidden"
        />
        <div className="flex items-start justify-between gap-space-md border-b border-outline-variant px-space-md pt-space-sm pb-space-md sm:p-space-lg">
          <div className="min-w-0">
            <h2
              id="team-dialog-title"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {editing ? t("editTitle") : t("createTitle")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">
              {editing ? t("editBody") : t("createBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={tCommon("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-space-md overflow-y-auto overscroll-contain p-space-md sm:p-space-lg">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("nameLabel")}</span>
              <input
                ref={firstFieldRef}
                name="name"
                required
                minLength={2}
                maxLength={60}
                autoComplete="off"
                defaultValue={admin?.name ?? ""}
                placeholder={t("namePlaceholder")}
                className={FIELD}
              />
            </label>

            {editing ? (
              <div className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("loginEmail")}</span>
                <p className="flex h-11 items-center truncate rounded-xl border border-outline-variant bg-surface-container px-3 font-body-sm text-body-sm text-secondary">
                  {admin.email}
                </p>
              </div>
            ) : (
              <label className="flex flex-col gap-1.5">
                <span className={LABEL}>{t("loginEmail")}</span>
                <input
                  type="email"
                  name="email"
                  required
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={t("emailPlaceholder")}
                  className={FIELD}
                />
              </label>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="team-password" className={LABEL}>
                {editing ? t("newPasswordLabel") : t("passwordLabel")}
              </label>
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <input
                    id="team-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required={!editing}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    aria-describedby="team-password-hint"
                    className={cn(FIELD, "pr-11 font-mono")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    aria-pressed={showPassword}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-secondary hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Icon
                      name={showPassword ? "visibility_off" : "visibility"}
                      className="text-lg"
                    />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                  className={SECONDARY}
                >
                  <Icon name="refresh" className="text-lg" />
                  <span className="hidden min-[400px]:inline">{t("generate")}</span>
                  <span className="sr-only min-[400px]:hidden">{t("generate")}</span>
                </button>
              </div>
              <p id="team-password-hint" className="font-body-sm text-body-sm text-text-muted">
                {editing ? t("newPasswordHint") : t("passwordHint")}
              </p>
            </div>

            <fieldset className="flex flex-col gap-1.5">
              <legend className={cn(LABEL, "mb-1.5")}>{t("desksLabel")}</legend>
              <div className="flex flex-col gap-2">
                {DESKS.map((desk) => (
                  <label
                    key={desk.key}
                    className="flex min-h-14 cursor-pointer items-center gap-space-sm rounded-xl border border-outline-variant bg-surface-dim px-space-sm py-2.5 transition-colors duration-200 hover:border-outline-hover has-checked:border-primary has-checked:bg-surface-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
                      <Icon name={desk.icon} className="text-lg" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-label-lg text-label-lg font-semibold text-on-surface">
                        {t(`${desk.key}.label`)}
                      </span>
                      <span className="block font-body-sm text-body-sm text-secondary">
                        {t(`${desk.key}.hint`)}
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      name={desk.key}
                      defaultChecked={(admin?.access ?? NO_ACCESS)[desk.key]}
                      className="h-5 w-5 shrink-0 cursor-pointer accent-primary"
                    />
                  </label>
                ))}
              </div>
            </fieldset>

            {error ? <InlineAlert>{t(`errors.${error}` as never)}</InlineAlert> : null}
          </div>

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-outline-variant bg-surface-low p-space-md pb-[max(var(--spacing-space-md),env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:rounded-b-[1.5rem] sm:p-space-lg">
            <button type="button" onClick={onClose} disabled={busy} className={SECONDARY}>
              {tCommon("cancel")}
            </button>
            <button type="submit" disabled={busy} className={PRIMARY}>
              {busy ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
              {editing ? t("save") : t("create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/** Shown once after creating an account: the password cannot be read back later. */
function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials;
  onClose: () => void;
}) {
  const t = useTranslations("Admin.team");
  const doneRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDialogA11y(true, onClose, doneRef);
  const [copied, setCopied] = useState<"email" | "password" | "both" | null>(null);

  function copy(value: string, which: "email" | "password" | "both") {
    void navigator.clipboard.writeText(value);
    setCopied(which);
  }

  const rows = [
    { key: "email", label: t("loginEmail"), value: credentials.email },
    { key: "password", label: t("passwordLabel"), value: credentials.password },
  ] as const;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-space-lg">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-created-title"
        className="flex w-full max-w-md flex-col gap-space-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-md pb-[max(var(--spacing-space-md),env(safe-area-inset-bottom))] shadow-lift-lg sm:rounded-[1.5rem] sm:p-space-lg"
      >
        <div className="flex items-start gap-space-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-surface text-success-text">
            <Icon name="check" className="text-xl" />
          </span>
          <div className="min-w-0">
            <h2
              id="team-created-title"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {t("createdTitle")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">{t("createdOnce")}</p>
          </div>
        </div>

        <dl className="flex flex-col gap-2">
          {rows.map((row) => (
            <div
              key={row.key}
              className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-dim py-1.5 pr-1.5 pl-3"
            >
              <div className="min-w-0 flex-1">
                <dt className="font-label-md text-label-md text-text-muted">{row.label}</dt>
                <dd className="font-mono text-sm break-all text-on-surface">{row.value}</dd>
              </div>
              <button
                type="button"
                onClick={() => copy(row.value, row.key)}
                aria-label={`${t("copy")}: ${row.label}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
              >
                <Icon name={copied === row.key ? "check" : "content_copy"} className="text-lg" />
              </button>
            </div>
          ))}
        </dl>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            type="button"
            onClick={() => copy(`${credentials.email}\n${credentials.password}`, "both")}
            className={SECONDARY}
          >
            <Icon name={copied === "both" ? "check" : "content_copy"} className="text-lg" />
            {copied === "both" ? t("copied") : t("copyBoth")}
          </button>
          <button ref={doneRef} type="button" onClick={onClose} className={PRIMARY}>
            {t("done")}
          </button>
        </div>
      </div>
    </div>
  );
}
