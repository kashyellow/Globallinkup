"use client";

import { useRef } from "react";

import { Spinner } from "@/components/ui/spinner";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";

/**
 * Destructive-action confirmation. Focus stays inside the dialog and returns to
 * the trigger on close; the confirm button can show a pending spinner.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  cancelLabel,
  pendingLabel,
  pending = false,
  tone = "danger",
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  pendingLabel?: string;
  pending?: boolean;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onClose: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDialogA11y(open, onClose, cancelRef);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (!pending && event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[90] flex items-end justify-center bg-background/80 p-0 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-body"
        tabIndex={-1}
        className="w-full max-w-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-lg shadow-lift-lg outline-none sm:rounded-[1.5rem]"
      >
        <h2
          id="confirm-dialog-title"
          className="font-headline-sm text-headline-sm font-semibold text-on-surface"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-body"
          className="mt-1 font-body-sm text-body-sm text-pretty text-secondary"
        >
          {body}
        </p>

        <div className="mt-space-lg flex flex-col-reverse gap-space-sm sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={pending}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-dim px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-space-lg py-2.5 font-label-lg text-label-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-70",
              tone === "danger"
                ? "bg-danger text-on-error hover:bg-danger-border-strong focus-visible:outline-danger-border-strong"
                : "bg-primary text-on-primary hover:bg-primary-hover focus-visible:outline-primary",
            )}
          >
            {pending ? (
              <Spinner className="h-4 w-4 text-current" label={pendingLabel ?? confirmLabel} />
            ) : null}
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
