"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Spinner } from "@/components/ui/spinner";
import { isStrongPassword, PasswordField } from "@/features/auth/components/password-field";
import { acceptInviteAction, type TeamState } from "@/features/admin/team-actions";

const INITIAL: TeamState = { ok: false };

export function AcceptInviteForm({ tokenHash }: { tokenHash: string }) {
  const t = useTranslations("AcceptInvite");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [state, action, pending] = useActionState(acceptInviteAction, INITIAL);

  const strong = isStrongPassword(password);
  const matches = password.length > 0 && password === confirm;
  const valid = strong && matches;

  return (
    <form action={action} className="flex flex-col gap-space-sm">
      <input type="hidden" name="token_hash" value={tokenHash} />
      <PasswordField
        id="invite-password"
        name="password"
        label={t("password")}
        value={password}
        onChange={setPassword}
        requirements
        invalid={password.length > 0 && !strong}
      />
      <PasswordField
        id="invite-confirm"
        name="confirm"
        label={t("confirm")}
        value={confirm}
        onChange={setConfirm}
        invalid={confirm.length > 0 && !matches}
      />
      {confirm.length > 0 && !matches ? (
        <p className="font-body-sm text-body-sm text-danger-text">{t("errors.mismatch")}</p>
      ) : null}
      {state.error ? (
        <p role="alert" className="font-body-sm text-body-sm text-danger-text">
          {t(`errors.${state.error}` as never)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || !valid}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-4 font-label-lg text-label-lg font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? <Spinner className="h-4 w-4 text-current" label={t("working")} /> : null}
        {t("submit")}
      </button>
    </form>
  );
}
