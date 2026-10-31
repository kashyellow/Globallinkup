"use client";

import { useTranslations } from "next-intl";

import { Icon } from "@/components/ui/icon";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";
import type { MarketplaceContact } from "../queries";
import { ConciergeActions } from "./concierge-actions";

export function MarketplaceInquiryDialog({
  contact,
  open,
  onClose,
}: {
  contact: MarketplaceContact;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("Marketplace.inquiry");
  const containerRef = useDialogA11y(open, onClose);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[75] flex items-end justify-center bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="marketplace-inquiry-title"
        className={cn(
          "flex w-full max-w-md flex-col gap-space-md rounded-t-[1.5rem] border border-outline-variant bg-surface-low p-space-lg shadow-lift-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        <div className="flex items-start justify-between gap-space-sm">
          <div>
            <p className="font-label-caps text-label-caps text-primary">{t("eyebrow")}</p>
            <h2
              id="marketplace-inquiry-title"
              className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {t("title")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <p className="font-body-sm text-body-sm text-secondary">{t("body")}</p>

        <ConciergeActions
          contact={contact}
          emailSubject={t("emailSubject")}
          whatsappMessage={t("whatsappMessage")}
          labels={{
            email: t("emailCta"),
            whatsapp: t("whatsappCta"),
            unavailable: t("contactUnavailable"),
          }}
        />
      </div>
    </div>
  );
}
