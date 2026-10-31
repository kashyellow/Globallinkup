"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  assignRoleAction,
  createRoleAction,
  inviteAdminAction,
  revokeInviteAction,
  saveRoleAction,
  type TeamState,
} from "@/features/admin/team-actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
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
  const roleNames = new Map(roles.map((role) => [role.id, role.name]));

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-space-lg px-margin-mobile pt-space-lg pb-page-mobile md:space-y-space-xl md:px-margin md:pt-block md:pb-page">
      <AdminPageHeader title={t("title")} description={t("body")} />

      <InviteForm roles={roles} />

      <section className="space-y-space-sm">
        <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
          {t("adminsTitle")}
        </h2>
        <ul className="grid gap-space-sm sm:grid-cols-2">
          {admins.map((admin) => (
            <li
              // Remount on a role change so the select shows the saved role, not
              // the previous server render.
              key={`${admin.id}:${admin.roleId ?? ""}`}
              className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-md"
            >
              <span className="flex flex-wrap items-center gap-2 font-label-lg text-label-lg font-semibold text-on-surface">
                {admin.name}
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-label-md text-label-md font-normal",
                    admin.roleId
                      ? "border-admin-border bg-admin-surface text-admin-text"
                      : "border-outline-variant text-on-surface-variant",
                  )}
                >
                  {admin.roleId ? (roleNames.get(admin.roleId) ?? t("noRole")) : t("noRole")}
                </span>
              </span>
              <AdminRoleForm admin={admin} roles={roles} />
            </li>
          ))}
        </ul>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{t("lastOwnerHint")}</p>
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
          <p className="font-body-sm text-body-sm text-on-surface-variant">{t("noInvites")}</p>
        ) : (
          <ul className="divide-y divide-outline-variant overflow-hidden rounded-2xl border border-outline-variant bg-surface-low">
            {invites.map((invite) => (
              <li key={invite.id} className="space-y-2 p-space-md">
                <p className="font-body-sm text-body-sm text-on-surface">{invite.email}</p>
                <p className="font-label-md text-label-md text-text-muted">
                  {invite.roleName || t("noRole")}
                </p>
                <div className="flex flex-wrap items-start gap-2">
                  <InviteLinkButton email={invite.email} roleId={invite.roleId} />
                  <RevokeInviteForm inviteId={invite.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * Assigning is a bare mutation, so the desk has to refetch the route itself:
 * the server action's `revalidatePath` targets the locale-less path, which does
 * not invalidate the cache entry for `/en/admin/team`.
 */
function AdminRoleForm({ admin, roles }: { admin: TeamAdmin; roles: TeamRole[] }) {
  const t = useTranslations("Admin.team");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [error, setError] = useState<string | null>(null);
  const pending = isPending("assign");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(null);
    await run("assign", async () => {
      const result = await assignRoleAction(formData);
      if (!result.ok) {
        setError(result.error ?? "unknown");
        return;
      }
      refresh();
    });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input type="hidden" name="profileId" value={admin.id} />
        <select
          name="roleId"
          defaultValue={admin.roleId ?? ""}
          aria-label={`${admin.name}: ${t("rolesTitle")}`}
          className={cn(FIELD, "min-w-0 flex-1")}
        >
          <option value="" disabled>
            {t("noRole")}
          </option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className={BUTTON}>
          {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
          {t("save")}
        </button>
      </div>
      {error ? (
        <p role="alert" className="font-body-sm text-body-sm text-danger-text">
          {error === "lastOwner" ? t("lastOwnerHint") : t(`errors.${error}` as never)}
        </p>
      ) : null}
    </form>
  );
}

/** Every mutation below refreshes the route, or the desk shows stale props. */

function InviteForm({ roles }: { roles: TeamRole[] }) {
  const t = useTranslations("Admin.team");
  const { refresh } = useRefresh();
  const [state, action, pending] = useActionState(
    async (previous: TeamState, formData: FormData) => {
      const next = await inviteAdminAction(previous, formData);
      if (next.ok) refresh();
      return next;
    },
    INITIAL,
  );
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
          aria-label={t("emailPlaceholder")}
          className={cn(FIELD, "flex-1")}
        />
        <select name="roleId" className={FIELD} defaultValue="" aria-label={t("rolesTitle")}>
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
    <div className="grid grid-cols-1 gap-space-xs min-[420px]:grid-cols-2">
      {ADMIN_CAPABILITIES.map((capability) => (
        <label
          key={capability}
          className="flex min-h-11 cursor-pointer items-center gap-space-sm rounded-xl border border-outline-variant px-space-sm font-body-sm text-body-sm text-on-surface transition-colors duration-200 has-checked:border-primary has-checked:bg-surface-container has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
        >
          <input
            type="checkbox"
            name="capability"
            value={capability}
            defaultChecked={selected.includes(capability)}
            className="h-5 w-5 shrink-0 accent-primary"
          />
          {t(capability)}
        </label>
      ))}
    </div>
  );
}

function RoleForm({ role }: { role: TeamRole }) {
  const t = useTranslations("Admin.team");
  const { refresh } = useRefresh();
  const [state, action, pending] = useActionState(
    async (previous: TeamState, formData: FormData) => {
      const next = await saveRoleAction(previous, formData);
      if (next.ok) refresh();
      return next;
    },
    INITIAL,
  );

  return (
    <details className="group rounded-2xl border border-outline-variant bg-surface-low">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-2 p-space-md font-label-lg text-label-lg font-semibold text-on-surface">
        <span className="flex items-center gap-2">
          {role.name}
          {role.isSystem ? (
            <span className="rounded-full border border-outline-variant px-2 py-0.5 font-label-md text-label-md font-normal text-on-surface-variant">
              {t("systemRole")}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-1 font-label-md text-label-md font-normal text-on-surface-variant">
          {t("permissionsCount", { count: role.capabilities.length })}
          <Icon
            name="expand_more"
            className="text-xl transition-transform duration-200 group-open:rotate-180"
          />
        </span>
      </summary>
      <form action={action} className="space-y-space-sm border-t border-outline-variant p-space-md">
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
  const { refresh } = useRefresh();
  const [state, action, pending] = useActionState(
    async (previous: TeamState, formData: FormData) => {
      const next = await inviteAdminAction(previous, formData);
      if (next.ok) refresh();
      return next;
    },
    INITIAL,
  );

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

function RevokeInviteForm({ inviteId }: { inviteId: string }) {
  const t = useTranslations("Admin.team");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [error, setError] = useState(false);
  const pending = isPending("revoke");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setError(false);
    await run("revoke", async () => {
      const result = await revokeInviteAction(formData);
      if (!result.ok) {
        setError(true);
        return;
      }
      refresh();
    });
  }

  return (
    <form onSubmit={submit}>
      <input type="hidden" name="inviteId" value={inviteId} />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-danger-border px-3 font-label-md text-label-md text-danger-text hover:bg-danger-surface disabled:opacity-60"
      >
        {pending ? <Spinner className="h-3.5 w-3.5 text-current" label={t("working")} /> : null}
        {t("revoke")}
      </button>
      {error ? (
        <span className="block font-body-sm text-body-sm text-danger-text">{t("saveError")}</span>
      ) : null}
    </form>
  );
}

function CreateRoleForm() {
  const t = useTranslations("Admin.team");
  const { refresh } = useRefresh();
  const [state, action, pending] = useActionState(
    async (previous: TeamState, formData: FormData) => {
      const next = await createRoleAction(previous, formData);
      if (next.ok) refresh();
      return next;
    },
    INITIAL,
  );

  return (
    <form
      action={action}
      className="space-y-space-sm rounded-2xl border border-dashed border-outline-variant p-space-md"
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
