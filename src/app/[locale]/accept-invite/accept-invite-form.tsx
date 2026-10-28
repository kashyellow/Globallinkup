"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/spinner";
import { acceptInviteAction, type TeamState } from "@/features/admin/team-actions";

const INITIAL: TeamState = { ok: false };
const FIELD =
  "min-h-11 w-full rounded-xl border border-outline-variant bg-surface-dim px-3 font-body-sm text-body-sm text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AcceptInviteForm({ tokenHash }: { tokenHash: string }) {
  const t = useTranslations("AcceptInvite");
  const [state, action, pending] = useActionState(acceptInviteAction, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-space-sm">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface">{t("password")}</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          maxLength={72}
          className={FIELD}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="font-label-md text-label-md text-on-surface">{t("confirm")}</span>
        <input
          type="password"
          name="confirm"
          required
          minLength={8}
          maxLength={72}
          className={FIELD}
        />
      </label>
      {state.error ? (
        <p role="alert" className="font-body-sm text-body-sm text-danger-text">
          {t(`errors.${state.error}` as never)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
        {t("submit")}
      </button>
    </form>
  );
}
