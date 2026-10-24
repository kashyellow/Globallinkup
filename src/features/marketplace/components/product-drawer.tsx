"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";
import type { MarketplaceContact, MarketplaceProduct } from "../queries";

export function ProductDrawer({
  product,
  contact,
  open,
  onClose,
}: {
  product: MarketplaceProduct | null;
  contact: MarketplaceContact;
  open: boolean;
  onClose: () => void;
}) {
  const containerRef = useDialogA11y(open, onClose);

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[60] flex justify-end overflow-hidden bg-background/80 backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <aside
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={product?.name}
        tabIndex={-1}
        className={cn(
          "flex h-full w-full max-w-xl transform flex-col overflow-y-auto border-l border-outline-variant bg-surface-low shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {product ? <DrawerContent product={product} contact={contact} onClose={onClose} /> : null}
      </aside>
    </div>
  );
}

function DrawerContent({
  product,
  contact,
  onClose,
}: {
  product: MarketplaceProduct;
  contact: MarketplaceContact;
  onClose: () => void;
}) {
  const t = useTranslations("Marketplace.drawer");

  const whatsappHref = `${contact.whatsappLink}?text=${encodeURIComponent(
    t("whatsappMessage", { product: product.name }),
  )}`;

  return (
    <>
      {/* Drawer header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-low/95 px-space-lg py-space-md backdrop-blur-md">
        <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-success-text">
          <Icon name="verified" className="text-xs" />
          {t("adminVerified")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </div>

      <div className="flex flex-col gap-space-lg p-space-lg">
        <div className="aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container">
          <MediaImage
            src={product.image}
            alt={product.imageAlt}
            wrapperClassName="h-full w-full"
            loading="eager"
          />
        </div>

        {/* Product identity — only the fields the admin form collects. */}
        <div className="flex flex-col gap-space-xs">
          <div className="flex items-center justify-between">
            <span className="font-label-lg text-label-lg font-semibold text-primary">
              {t("artisanPartnerDirect")}
            </span>
            <span className="font-headline-lg text-headline-lg-mobile font-bold text-on-surface md:text-headline-lg">
              ${product.price}{" "}
              <span className="font-label-md text-label-md font-normal text-secondary">
                {t("currencyUsd")}
              </span>
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
            {product.name}
          </h2>
          {product.originLabel ? (
            <span className="inline-flex items-center gap-1 font-label-md text-label-md text-secondary">
              <Icon name="location_on" className="text-sm text-tertiary" />
              {product.originLabel}
            </span>
          ) : null}
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
            {product.description}
          </p>
        </div>

        {/* How to order */}
        <div className="flex flex-col gap-space-sm rounded-[1.25rem] border border-outline-variant bg-surface-container p-space-md">
          <div className="flex items-center gap-2 font-label-lg text-label-lg font-semibold text-primary">
            <Icon name="info" className="text-lg" />
            <span>{t("howToOrderTitle")}</span>
          </div>
          <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
            {t("howToOrderBody")}
          </p>
        </div>

        {/* Seller contact — the phone the admin entered for this piece. */}
        {product.sellerPhone ? (
          <div className="flex items-center gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md">
            <Icon name="call" className="text-lg text-tertiary" />
            <span className="font-label-md text-label-md text-secondary">{t("sellerPhone")}</span>
            <a
              href={`tel:${product.sellerPhone.replace(/\s/g, "")}`}
              className="ml-auto rounded font-semibold text-on-surface transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {product.sellerPhone}
            </a>
          </div>
        ) : null}

        {/* Concierge CTA */}
        <div className="flex flex-col gap-space-sm">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            <Icon name="forum" className="text-xl" />
            {t("contactCta")}
          </a>
          <div className="mt-1 flex items-center justify-center gap-2 font-label-md text-label-md text-secondary">
            <span>{t("whatsappPrefix")}</span>
            <a
              href={`tel:${contact.whatsappNumber.replace(/\s/g, "")}`}
              className="rounded font-semibold text-on-surface transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {contact.whatsappNumber}
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 font-label-md text-label-md text-secondary">
            <span>{t("emailPrefix")}</span>
            <a
              href={`mailto:${contact.email}`}
              className="rounded font-semibold text-on-surface transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {contact.email}
            </a>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-x-space-md gap-y-2 border-t border-outline-variant pt-space-md font-label-md text-label-md text-secondary">
          {(["fairCompensation", "customsInsured", "directMaker"] as const).map((key) => (
            <div key={key} className="flex items-center gap-1">
              <Icon name="check_circle" className="text-sm text-tertiary" />
              <span>{t(`trust.${key}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
