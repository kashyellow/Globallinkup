"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { deleteOwnAccountAction, type DeleteAccountError } from "@/features/profile/actions";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRouter } from "@/lib/i18n/navigation";

const CONFIRM_WORD = "DELETE";

/** Permanent self-service deletion. The server re-checks who may delete. */
export function DeleteProfileCard() {
  const t = useTranslations("Profile.delete");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { isPending, run } = usePendingAction();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<DeleteAccountError | null>(null);

  function close() {
    setOpen(false);
    setTyped("");
    setError(null);
  }

  async function confirm() {
    setError(null);
    await run("delete", async () => {
      try {
        const result = await deleteOwnAccountAction({ confirm: typed });
        if (result.ok) router.replace(result.redirectTo);
        else setError(result.error);
      } catch {
        setError("unknown");
      }
    });
  }

  return (
    <section
      aria-labelledby="delete-profile-title"
      className="mt-space-lg rounded-2xl border border-danger-border bg-surface-low p-space-md md:p-space-lg"
    >
      <h2
        id="delete-profile-title"
        className="font-label-lg text-label-lg font-semibold tracking-wide text-danger-text uppercase"
      >
        {t("title")}
      </h2>
      <p className="mt-1 max-w-[60ch] font-body-sm text-body-sm text-secondary">{t("body")}</p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-space-sm inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-danger-border px-4 font-label-md text-label-md text-danger-text transition-colors hover:bg-danger-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
      >
        <Icon name="delete_forever" className="text-lg" />
        {t("button")}
      </button>

      <ConfirmDialog
        open={open}
        title={t("dialogTitle")}
        body={t("dialogBody")}
        confirmLabel={t("confirm")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={t("working")}
        pending={isPending("delete")}
        confirmDisabled={typed !== CONFIRM_WORD}
        onClose={close}
        onConfirm={() => void confirm()}
      >
        <label className="mt-space-md flex flex-col gap-1.5">
          <span className="font-label-md text-label-md font-semibold text-on-surface">
            {t("typeLabel")}
          </span>
          <input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="h-11 w-full rounded-xl border border-outline-variant bg-surface-dim px-3 font-body-sm text-body-sm text-on-surface focus:border-danger focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-border-strong"
          />
        </label>
        {error ? <InlineAlert className="mt-space-sm">{t(`errors.${error}`)}</InlineAlert> : null}
      </ConfirmDialog>
    </section>
  );
}
