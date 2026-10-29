"use client";

import type { CSSProperties } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { SentRequestDto } from "../queries";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function SentRequestsPanel({ requests }: { requests: SentRequestDto[] }) {
  const t = useTranslations("Connections.sent");
  const format = useFormatter();
  const [noteTarget, setNoteTarget] = useState<SentRequestDto | null>(null);

  return (
    <div className="bezel-tray">
      <div
        className="space-y-space-md bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div>
          <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface tabular-nums">
            {t("title", { count: requests.length })}
          </h3>
          <p className="mt-space-xs font-body-md text-body-md text-on-surface-strong">
            {t("body")}
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-outline-variant bg-surface-container py-space-xl text-center">
            <Icon name="outbox" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
            <p className="max-w-[46ch] font-body-sm text-body-sm text-secondary">
              {t("emptyBody")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            {requests.map((request) => (
              <article
                key={request.id}
                className="flex flex-col justify-between gap-space-md rounded-[1.25rem] border border-outline-variant bg-surface-container p-space-md"
              >
                <div className="flex items-start justify-between gap-space-sm">
                  <Link
                    href={`/persona/${request.profileId}`}
                    className="group flex min-w-0 items-center gap-space-md rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {request.avatar ? (
                      <MediaImage
                        src={request.avatar}
                        alt={request.name}
                        wrapperClassName="h-14 w-14 shrink-0 rounded-full ring-1 ring-outline-variant"
                      />
                    ) : (
                      <DefaultAvatar className="h-14 w-14 shrink-0 rounded-full ring-1 ring-outline-variant" />
                    )}
                    <div className="min-w-0">
                      <h4 className="truncate font-headline-sm text-headline-sm font-medium text-on-surface transition-colors group-hover:text-primary">
                        {request.age > 0 ? `${request.name}, ${request.age}` : request.name}
                      </h4>
                      <p className="truncate font-body-sm text-body-sm text-secondary">
                        {request.location}
                      </p>
                    </div>
                  </Link>
                  <span className="shrink-0 rounded-full border border-primary-container/40 bg-primary-container/10 px-2.5 py-1 font-label-md text-label-md font-semibold whitespace-nowrap text-primary">
                    {t("awaiting")}
                  </span>
                </div>

                <div className="rounded-2xl border border-outline-variant bg-surface-low p-space-md">
                  <div className="flex items-center justify-between gap-space-sm">
                    <span className="font-label-md text-label-md font-semibold tracking-[0.08em] text-text-muted uppercase">
                      {t("yourNote")}
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 font-label-md text-label-md text-secondary"
                      suppressHydrationWarning
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-container" />
                      {t("sentOn", {
                        date: format.dateTime(new Date(request.createdAt), "dayMonth"),
                      })}
                    </span>
                  </div>
                  <p className="mt-space-sm line-clamp-3 font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
                    “{request.intro}”
                  </p>
                  <button
                    type="button"
                    onClick={() => setNoteTarget(request)}
                    className={cn(
                      "mt-space-sm inline-flex min-h-10 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                      EASE,
                    )}
                  >
                    {t("readNote")}
                    <Icon name="arrow_forward" className="text-base" />
                  </button>
                </div>

                <Link
                  href={`/persona/${request.profileId}`}
                  className="inline-flex min-h-10 items-center gap-1.5 font-label-md text-label-md font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t("viewPersona")}
                  <Icon name="open_in_new" className="text-sm" />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>

      <SentNoteDialog
        request={noteTarget}
        open={noteTarget !== null}
        onClose={() => setNoteTarget(null)}
      />
    </div>
  );
}

function SentNoteDialog({
  request,
  open,
  onClose,
}: {
  request: SentRequestDto | null;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Connections.sent");
  const tCommon = useTranslations("Common");
  const containerRef = useDialogA11y(open, onClose);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[85] flex items-end justify-center bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sent-note-title"
        className={cn(
          "flex max-h-[92dvh] w-full max-w-lg flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        {request ? (
          <>
            <div className="flex items-start justify-between gap-space-sm border-b border-outline-variant p-space-lg">
              <div>
                <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
                  {t("yourNote")}
                </p>
                <h2
                  id="sent-note-title"
                  className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
                >
                  {request.name}
                </h2>
                <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                  {request.location}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeNote")}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>
            <div className="p-space-lg">
              <div className="relative rounded-2xl border border-outline-variant bg-surface-container p-space-lg">
                <Icon
                  name="format_quote"
                  className="absolute top-3 left-3 text-3xl text-primary/25"
                />
                <p className="relative mt-space-sm font-body-md text-body-md leading-relaxed text-on-surface-strong italic">
                  “{request.intro}”
                </p>
              </div>
              <div className="mt-space-lg flex flex-col gap-space-sm sm:flex-row sm:justify-end">
                <Link
                  href={`/persona/${request.profileId}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  {t("viewPersona")}
                  <Icon name="open_in_new" className="text-sm" />
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-low px-5 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {tCommon("close")}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
