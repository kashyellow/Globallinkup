"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { AdminPageHeader } from "@/features/admin/components/admin-page-header";
import {
  inviteMemberAction,
  resendInviteAction,
  revokeInviteAction,
  type InviteError,
} from "@/features/admin/invite-actions";
import type { PendingInvite } from "@/features/admin/queries";
import { AvatarCropDialog } from "@/features/persona/components/avatar-crop-dialog";
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

const PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Admin "Invite user" desk (ADR 0010): send an invite, then manage the open ones. */
export function AdminInviteTab({ invites }: { invites: PendingInvite[] }) {
  const t = useTranslations("Admin.invite");
  const tCommon = useTranslations("Common");
  const format = useFormatter();
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const formRef = useRef<HTMLFormElement>(null);

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [error, setError] = useState<InviteError | null>(null);
  const [notice, setNotice] = useState<"sent" | "resent" | "revoked" | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<PendingInvite | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (cropSource) URL.revokeObjectURL(cropSource);
    };
  }, [cropSource]);

  function pickPhoto(file?: File) {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type) || file.size > PHOTO_MAX_BYTES) {
      setError("photoInvalid");
      return;
    }
    setError(null);
    setCropSource(URL.createObjectURL(file));
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.delete("photoPicker");
    if (photo) formData.set("photo", photo);
    setError(null);
    setNotice(null);
    await run("invite", async () => {
      const result = await inviteMemberAction({ ok: false }, formData);
      if (!result.ok) {
        setError(result.error ?? "unknown");
        return;
      }
      formRef.current?.reset();
      clearPhoto();
      setNotice("sent");
      refresh();
    });
  }

  async function act(kind: "resend" | "revoke", invite: PendingInvite) {
    const formData = new FormData();
    formData.set("userId", invite.userId);
    setError(null);
    setNotice(null);
    await run(`${kind}:${invite.userId}`, async () => {
      const action = kind === "resend" ? resendInviteAction : revokeInviteAction;
      const result = await action({ ok: false }, formData);
      if (!result.ok) {
        setError(result.error ?? "unknown");
        return;
      }
      if (kind === "revoke") setRevokeTarget(null);
      setNotice(kind === "resend" ? "resent" : "revoked");
      refresh();
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1000px] px-margin-mobile pt-space-lg pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <AdminPageHeader title={t("title")} description={t("body")} />

      {error ? <InlineAlert className="mt-space-md">{t(`errors.${error}`)}</InlineAlert> : null}
      {notice ? (
        <InlineAlert tone="success" className="mt-space-md">
          {t(`notices.${notice}`)}
        </InlineAlert>
      ) : null}

      <form
        ref={formRef}
        onSubmit={submit}
        className="mt-space-lg grid gap-space-md rounded-2xl border border-outline-variant bg-surface-low p-space-md md:grid-cols-[auto_1fr]"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-outline-variant bg-surface-dim text-secondary">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img
                src={photoPreview}
                alt={t("photoPreviewAlt")}
                className="h-full w-full object-cover"
              />
            ) : (
              <Icon name="add_photo_alternate" className="text-3xl" />
            )}
          </span>
          <label className={cn(SECONDARY, "cursor-pointer")}>
            {photo ? t("changePhoto") : t("addPhoto")}
            <input
              type="file"
              name="photoPicker"
              accept={PHOTO_TYPES.join(",")}
              className="sr-only"
              onChange={(event) => {
                pickPhoto(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          {photo ? (
            <button
              type="button"
              onClick={clearPhoto}
              className="font-label-md text-label-md text-secondary underline"
            >
              {t("removePhoto")}
            </button>
          ) : null}
          <span className="max-w-[18ch] text-center font-body-sm text-body-sm text-text-muted">
            {t("photoHint")}
          </span>
        </div>

        <div className="grid gap-space-sm sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{t("emailLabel")}</span>
            <input name="email" type="email" required autoComplete="off" className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{t("nameLabel")}</span>
            <input name="fullName" required minLength={2} maxLength={60} className={FIELD} />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{t("localeLabel")}</span>
            <select name="locale" defaultValue="en" className={FIELD}>
              <option value="en">{t("localeEn")}</option>
              <option value="es">{t("localeEs")}</option>
            </select>
          </label>
          <div className="flex items-end">
            <button type="submit" disabled={isPending("invite")} className={cn(PRIMARY, "w-full")}>
              <Icon name="send" className="text-lg" />
              {isPending("invite") ? t("sending") : t("send")}
            </button>
          </div>
        </div>
      </form>

      <section aria-labelledby="invite-pending" className="mt-space-lg">
        <h2
          id="invite-pending"
          className="font-label-lg text-label-lg font-semibold tracking-wide text-secondary uppercase"
        >
          {t("pendingTitle", { count: invites.length })}
        </h2>

        {invites.length === 0 ? (
          <p className="mt-space-sm rounded-2xl border border-dashed border-outline-variant bg-surface-low px-space-md py-space-lg text-center font-body-sm text-body-sm text-secondary">
            {t("noPending")}
          </p>
        ) : (
          <ul className="mt-space-sm flex flex-col gap-space-sm">
            {invites.map((invite) => {
              const opened = invite.openedAt !== null;
              return (
                <li
                  key={invite.userId}
                  className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-low p-space-md md:flex-row md:items-center md:gap-space-md"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-label-lg text-label-lg font-semibold text-on-surface">
                      {invite.displayName}
                    </p>
                    <p className="truncate font-body-sm text-body-sm text-secondary">
                      {invite.email}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 font-body-sm text-body-sm text-text-muted">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 font-label-md text-label-md",
                          opened
                            ? "border-warning-border bg-warning-surface text-warning-text"
                            : "border-admin-border bg-admin-surface text-admin-text",
                        )}
                      >
                        {opened ? t("statusOpened") : t("statusSent")}
                      </span>
                      <span>
                        {t("lastSent", {
                          date: format.dateTime(new Date(invite.lastSentAt), {
                            dateStyle: "medium",
                          }),
                        })}
                      </span>
                      <span>{invite.locale.toUpperCase()}</span>
                    </p>
                    {opened ? (
                      <p className="mt-1 font-body-sm text-body-sm text-secondary">
                        {t("openedHint")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={opened || isPending(`resend:${invite.userId}`)}
                      onClick={() => void act("resend", invite)}
                      className={SECONDARY}
                    >
                      <Icon name="refresh" className="text-lg" />
                      {t("resend")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRevokeTarget(invite)}
                      className={DANGER}
                    >
                      <Icon name="block" className="text-lg" />
                      {t("revoke")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <AvatarCropDialog
        image={cropSource}
        open={cropSource !== null}
        onCancel={() => setCropSource(null)}
        onConfirm={(file) => {
          setPhoto(file);
          setPhotoPreview(URL.createObjectURL(file));
          setCropSource(null);
        }}
      />

      <ConfirmDialog
        open={revokeTarget !== null}
        title={t("revokeTitle", { name: revokeTarget?.displayName ?? "" })}
        body={t("revokeBody")}
        confirmLabel={t("revoke")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={t("working")}
        pending={revokeTarget ? isPending(`revoke:${revokeTarget.userId}`) : false}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) void act("revoke", revokeTarget);
        }}
      />
    </div>
  );
}
