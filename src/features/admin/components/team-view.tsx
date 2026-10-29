"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/spinner";
import {
  assignRoleAction,
  createRoleAction,
  inviteAdminAction,
  revokeInviteAction,
  saveRoleAction,
  type TeamState,
} from "@/features/admin/team-actions";
import { ADMIN_CAPABILITIES } from "@/lib/admin-capabilities";
import { cn } from "@/lib/utils";

const INITIAL: TeamState = { ok: false };
const FIELD =
  "min-h-11 rounded-xl border border-outline-variant bg-surface-dim px-3 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-60";

export type TeamRole = {
  id: string;
  slug: string;
  name: string;
  capabilities: string[];
  isSystem: boolean;
};

export type TeamAdmin = { id: string; name: string; roleId: string | null };
export type TeamInvite = { id: string; email: string; roleName: string; roleId: string | null };

export function TeamView({
  roles,
  admins,
  invites,
}: {
  roles: TeamRole[];
  admins: TeamAdmin[];
  invites: TeamInvite[];
}) {
  const t = useTranslations("Admin.team");

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-space-xl px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <header className="space-y-1">
        <h1 className="font-title text-title-mobile text-on-surface md:text-title">{t("title")}</h1>
        <p className="max-w-[70ch] font-body-md text-body-md text-secondary">{t("body")}</p>
      </header>

      <InviteForm roles={roles} />

      <section className="space-y-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("adminsTitle")}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {admins.map((admin) => (
            <li
              key={admin.id}
              className="flex flex-wrap items-center justify-between gap-2 p-space-md"
            >
              <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
                {admin.name}
                {admin.roleId === null ? (
                  <span className="rounded-full border border-outline-variant px-2 py-0.5 font-label-md text-label-md text-text-muted">
                    {t("noRole")}
                  </span>
                ) : null}
              </span>
              <form action={assignRoleAction} className="flex items-center gap-2">
                <input type="hidden" name="profileId" value={admin.id} />
                <select name="roleId" defaultValue={admin.roleId ?? ""} className={FIELD}>
                  <option value="" disabled>
                    {t("noRole")}
                  </option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className={BUTTON}>
                  {t("save")}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <p className="font-body-sm text-body-sm text-text-muted">{t("lastOwnerHint")}</p>
      </section>

      <section className="space-y-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("rolesTitle")}
        </h2>
        <div className="space-y-space-sm">
          {roles.map((role) => (
            <RoleForm key={role.id} role={role} />
          ))}
        </div>
        <CreateRoleForm />
      </section>

      <section className="space-y-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("invitesTitle")}
        </h2>
        {invites.length === 0 ? (
          <p className="font-body-sm text-body-sm text-text-muted">{t("noInvites")}</p>
        ) : (
          <ul className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="space-y-2 rounded-2xl border border-outline-variant bg-surface-low p-4"
              >
                <p className="font-body-sm text-body-sm text-on-surface">{invite.email}</p>
                <p className="font-label-md text-label-md text-text-muted">
                  {invite.roleName || t("noRole")}
                </p>
                <div className="flex flex-wrap items-start gap-2">
                  <InviteLinkButton email={invite.email} roleId={invite.roleId} />
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center rounded-full border border-danger-border px-3 font-label-md text-label-md text-danger-text hover:bg-danger-surface"
                    >
                      {t("revoke")}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function InviteForm({ roles }: { roles: TeamRole[] }) {
  const t = useTranslations("Admin.team");
  const [state, action, pending] = useActionState(inviteAdminAction, INITIAL);
  const [copied, setCopied] = useState(false);

  return (
    <section className="space-y-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-md">
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
        {t("inviteTitle")}
      </h2>
      <p className="font-body-sm text-body-sm text-secondary">{t("inviteBody")}</p>
      <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className={cn(FIELD, "flex-1")}
        />
        <select name="roleId" className={FIELD} defaultValue="">
          <option value="">{t("assignLater")}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
          {t("generateLink")}
        </button>
      </form>
      {state.error ? (
        <p role="alert" className="font-body-sm text-body-sm text-danger-text">
          {t(`errors.${state.error}` as never)}
        </p>
      ) : null}
      {state.link ? (
        <div className="space-y-1">
          <p className="font-label-md text-label-md text-on-surface">{t("linkOnce")}</p>
          <div className="flex gap-2">
            <input readOnly value={state.link} className={cn(FIELD, "flex-1 truncate")} />
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(state.link ?? "");
                setCopied(true);
              }}
              className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-4 font-label-md text-label-md"
            >
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function CapabilityChecks({ selected }: { selected: string[] }) {
  const t = useTranslations("Admin.capabilities");
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
      {ADMIN_CAPABILITIES.map((capability) => (
        <label key={capability} className="flex items-center gap-2 font-body-sm text-body-sm">
          <input
            type="checkbox"
            name="capability"
            value={capability}
            defaultChecked={selected.includes(capability)}
            className="h-4 w-4 rounded border-outline-variant"
          />
          {t(capability)}
        </label>
      ))}
    </div>
  );
}

function RoleForm({ role }: { role: TeamRole }) {
  const t = useTranslations("Admin.team");
  const [state, action, pending] = useActionState(saveRoleAction, INITIAL);

  return (
    <details className="rounded-2xl border border-outline-variant bg-surface-low">
      <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 p-4 font-label-lg text-label-lg font-semibold text-on-surface">
        <span className="flex items-center gap-2">
          {role.name}
          {role.isSystem ? (
            <span className="rounded-full border border-outline-variant px-2 py-0.5 font-label-md text-label-md text-text-muted">
              {t("systemRole")}
            </span>
          ) : null}
        </span>
        <span className="font-label-md text-label-md text-text-muted">
          {role.capabilities.length}
        </span>
      </summary>
      <form action={action} className="space-y-2 border-t border-outline-variant p-4">
        <input type="hidden" name="roleId" value={role.id} />
        <CapabilityChecks selected={role.capabilities} />
        <div className="flex items-center gap-3">
          <button type="submit" disabled={pending} className={BUTTON}>
            {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
            {t("save")}
          </button>
          {state.ok ? (
            <span className="font-body-sm text-body-sm text-success-text">{t("saved")}</span>
          ) : null}
          {state.error ? (
            <span className="font-body-sm text-body-sm text-danger-text">{t("saveError")}</span>
          ) : null}
        </div>
      </form>
    </details>
  );
}

function InviteLinkButton({ email, roleId }: { email: string; roleId: string | null }) {
  const t = useTranslations("Admin.team");
  const [state, action, pending] = useActionState(inviteAdminAction, INITIAL);

  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="roleId" value={roleId ?? ""} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-outline-variant px-3 font-label-md text-label-md hover:bg-surface-container disabled:opacity-60"
      >
        {pending ? <Spinner className="h-3.5 w-3.5 text-current" label={t("working")} /> : null}
        {t("newLink")}
      </button>
      {state.link ? (
        <input readOnly value={state.link} className={cn(FIELD, "w-full text-xs")} />
      ) : null}
      {state.error ? (
        <span className="block font-body-sm text-body-sm text-danger-text">{t("linkFailed")}</span>
      ) : null}
    </form>
  );
}

function CreateRoleForm() {
  const t = useTranslations("Admin.team");
  const [state, action, pending] = useActionState(createRoleAction, INITIAL);

  return (
    <form
      action={action}
      className="space-y-2 rounded-2xl border border-dashed border-outline-variant p-4"
    >
      <p className="font-label-lg text-label-lg font-semibold text-on-surface">
        {t("newRoleTitle")}
      </p>
      <input
        name="name"
        required
        placeholder={t("roleNamePlaceholder")}
        className={cn(FIELD, "w-full")}
      />
      <CapabilityChecks selected={[]} />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
          {t("createRole")}
        </button>
        {state.error ? (
          <span className="font-body-sm text-body-sm text-danger-text">
            {t(state.error === "exists" ? "roleExists" : "saveError")}
          </span>
        ) : null}
      </div>
    </form>
  );
}
