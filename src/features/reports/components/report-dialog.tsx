"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { createReportAction } from "@/features/reports/actions";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";

const REASONS = ["spam", "harassment", "inappropriate", "other"] as const;
type Reason = (typeof REASONS)[number];
type SendState = "idle" | "sending" | "sent" | "error";

/** Draft is keyed by target so opening a different report starts blank. */
type Draft = { id: string; reason: Reason; details: string; state: SendState };

const EMPTY: Draft = { id: "", reason: "inappropriate", details: "", state: "idle" };

export function ReportDialog({
  target,
  open,
  onClose,
}: {
  target: { type: "user" | "post"; id: string; name: string } | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Common.report");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const containerRef = useDialogA11y(open, onClose);

  const targetId = target?.id ?? "";
  const current: Draft = draft.id === targetId ? draft : { ...EMPTY, id: targetId };
  const sending = current.state === "sending";
  const update = (patch: Partial<Draft>) => setDraft({ ...current, ...patch });

  async function submit() {
    if (!target || sending) return;
    update({ state: "sending" });
    try {
      const result = await createReportAction({
        targetType: target.type,
        targetId: target.id,
        reason: current.reason,
        details: current.details,
      });
      update({ state: result.ok ? "sent" : "error" });
    } catch {
      update({ state: "error" });
    }
  }

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[80] flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-busy={sending || undefined}
        aria-labelledby="report-dialog-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-lg shadow-lift-lg outline-none sm:rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <h2
              id="report-dialog-title"
              className="font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {t("title")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">
              {t("body", { name: target?.name ?? "" })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cancel")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant text-secondary transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="close" />
          </button>
        </div>

        {current.state === "sent" ? (
          <div className="mt-space-md flex flex-col items-center gap-2 rounded-2xl border border-success-border bg-success-surface p-space-lg text-center">
            <Icon name="check_circle" className="text-2xl text-success-text" />
            <p className="font-label-lg text-label-lg font-semibold text-success-text">
              {t("sent")}
            </p>
          </div>
        ) : (
          <form
            aria-busy={sending || undefined}
            className="mt-space-md flex flex-col gap-space-md"
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
          >
            <fieldset className="flex flex-col gap-2" disabled={sending}>
              <legend className="font-label-md text-label-md font-semibold text-on-surface">
                {t("reasonLabel")}
              </legend>
              {REASONS.map((key) => (
                <label
                  key={key}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 font-body-sm text-body-sm transition-colors",
                    current.reason === key
                      ? "border-primary bg-primary/10 text-on-surface"
                      : "border-outline-variant text-secondary hover:border-outline",
                  )}
                >
                  <input
                    type="radio"
                    name="report-reason"
                    value={key}
                    checked={current.reason === key}
                    onChange={() => update({ reason: key })}
                    className="h-4 w-4 accent-primary"
                  />
                  {t(`reasons.${key}`)}
                </label>
              ))}
            </fieldset>

            <label className="flex flex-col gap-1.5">
              <span className="font-label-md text-label-md font-semibold text-on-surface">
                {t("detailsLabel")}
              </span>
              <textarea
                rows={3}
                maxLength={1000}
                value={current.details}
                disabled={sending}
                onChange={(event) => update({ details: event.target.value })}
                placeholder={t("detailsPlaceholder")}
                className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
              />
            </label>

            {current.state === "error" ? <InlineAlert>{t("error")}</InlineAlert> : null}

            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 rounded-full border border-outline-variant px-4 font-label-md text-label-md text-on-surface hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("cancel")}
              </button>
              <button
                type="submit"
                disabled={sending}
                aria-busy={sending || undefined}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-4 font-label-md text-label-md font-semibold text-on-primary hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-70"
              >
                {sending ? <Spinner className="h-4 w-4 text-current" label={t("sending")} /> : null}
                {sending ? t("sending") : t("submit")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
