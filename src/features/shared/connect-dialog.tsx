"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Matches the single-inquiry rule in the privacy rail copy. */
const MAX_NOTE = 280;

/** The minimum a card needs to offer a note-backed connection request. */
export type ConnectTarget = {
  id: string;
  name: string;
  age?: number;
  location: string;
  image: string;
  imageAlt: string;
};

export function ConnectDialog({
  target,
  open,
  onClose,
  onSend,
}: {
  target: ConnectTarget | null;
  open: boolean;
  onClose: () => void;
  onSend: (note: string) => void;
}) {
  const t = useTranslations("Common.connectDialog");
  const [draft, setDraft] = useState<{ id: string; text: string }>({ id: "", text: "" });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Focus returns to the card button that opened the dialog once it closes.
    restoreRef.current = document.activeElement as HTMLElement | null;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 150);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus();
    };
  }, [open, onClose]);

  // The draft belongs to the person it was typed for, so opening a different
  // card always starts from a blank note without a reset effect.
  const note = draft.id === target?.id ? draft.text : "";
  const canSend = note.trim().length > 0;
  const firstName = target?.name.split(" ")[0] ?? "";

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="connect-dialog-title"
        className={cn(
          "flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        {target ? (
          <>
            <div className="flex items-start justify-between gap-space-sm border-b border-outline-variant p-space-lg">
              <div className="flex min-w-0 items-center gap-space-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={target.imageAlt}
                  src={target.image}
                  className="h-12 w-12 shrink-0 rounded-full border border-outline-variant object-cover"
                />
                <div className="min-w-0">
                  <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
                    {t("eyebrow")}
                  </p>
                  <h2
                    id="connect-dialog-title"
                    className="mt-0.5 truncate font-headline-sm text-headline-sm font-semibold text-on-surface"
                  >
                    {target.age ? `${target.name}, ${target.age}` : target.name}
                  </h2>
                  <p className="flex items-center gap-1 font-body-sm text-body-sm text-secondary">
                    <Icon name="location_on" className="text-sm" />
                    {target.location}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("close")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors duration-300 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!canSend) return;
                onSend(note.trim());
              }}
              className="flex flex-col gap-space-md p-space-lg"
            >
              <p className="font-body-sm text-body-sm text-pretty text-secondary">
                {t("body", { name: firstName })}
              </p>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-space-sm">
                  <label
                    htmlFor="connect-dialog-note"
                    className="font-label-md text-label-md font-semibold text-on-surface"
                  >
                    {t("noteLabel")}{" "}
                    <span className="font-normal text-text-muted">({t("noteRequirement")})</span>
                  </label>
                  <span className="font-label-md text-label-md text-text-muted tabular-nums">
                    {t("charCount", { count: note.length, max: MAX_NOTE })}
                  </span>
                </div>
                <textarea
                  id="connect-dialog-note"
                  ref={textareaRef}
                  rows={5}
                  maxLength={MAX_NOTE}
                  value={note}
                  onChange={(event) => setDraft({ id: target.id, text: event.target.value })}
                  placeholder={t("notePlaceholder", { name: firstName })}
                  className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim px-space-md py-3 font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
                <p className="flex items-start gap-1.5 font-body-sm text-body-sm text-text-muted">
                  <Icon name="lightbulb" className="mt-0.5 text-sm text-primary" />
                  <span>{t("noteHint")}</span>
                </p>
              </div>

              <div className="flex items-center gap-space-xs rounded-2xl border border-outline-variant bg-surface-container p-space-sm">
                <Icon name="shield" className="text-lg text-tertiary" />
                <span className="font-body-sm text-body-sm text-secondary">{t("privacyNote")}</span>
              </div>

              <div className="flex flex-col gap-space-sm border-t border-outline-variant pt-space-md sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-dim px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={!canSend}
                  className="inline-flex min-h-11 items-center justify-center gap-space-xs rounded-full bg-primary px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:cursor-not-allowed disabled:bg-surface-container disabled:text-text-muted disabled:hover:bg-surface-container"
                >
                  <Icon name="send" className="text-lg" />
                  {t("send")}
                </button>
              </div>
            </form>
          </>
        ) : null}
      </div>
    </div>
  );
}
