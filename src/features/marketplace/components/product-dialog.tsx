"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";
import type { MarketplaceContact, MarketplaceProduct } from "../queries";
import { ConciergeActions } from "./concierge-actions";

export function ProductDialog({
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
        "fixed inset-0 z-[70] flex items-end justify-center bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={product?.name ?? "Product detail"}
        tabIndex={-1}
        className={cn(
          "flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        {product ? (
          <DialogContent key={product.id} product={product} contact={contact} onClose={onClose} />
        ) : null}
      </div>
    </div>
  );
}

function DialogContent({
  product,
  contact: catalogContact,
  onClose,
}: {
  product: MarketplaceProduct;
  contact: MarketplaceContact;
  onClose: () => void;
}) {
  // The piece's own contact wins; the catalog-wide concierge is the fallback.
  const contact = product.contact.email || product.contact.phone ? product.contact : catalogContact;
  const t = useTranslations("Marketplace.drawer");
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const images = product.images;
  const active = images.length > 0 ? Math.min(index, images.length - 1) : 0;

  function move(next: number) {
    if (images.length < 2) return;
    setIndex((next + images.length) % images.length);
  }

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-end border-b border-outline-variant bg-surface-low/95 px-space-lg py-space-md backdrop-blur-md">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors duration-300 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Icon name="close" className="text-xl" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-space-lg p-space-lg md:grid-cols-2">
        <div className="flex flex-col gap-space-sm">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container">
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="block h-full w-full focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              aria-label={t("openImage")}
            >
              <MediaImage
                src={images[active] ?? null}
                alt={product.imageAlt}
                wrapperClassName="h-full w-full"
                loading="eager"
              />
            </button>

            {images.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => move(active - 1)}
                  aria-label={t("previousImage")}
                  className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon name="arrow_back" className="text-xl" />
                </button>
                <button
                  type="button"
                  onClick={() => move(active + 1)}
                  aria-label={t("nextImage")}
                  className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon name="arrow_forward" className="text-xl" />
                </button>
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                  {images.map((_, dot) => (
                    <button
                      key={dot}
                      type="button"
                      onClick={() => setIndex(dot)}
                      aria-label={t("imageOf", { number: dot + 1, total: images.length })}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                        dot === active ? "w-5 bg-white" : "w-2 bg-white/55 hover:bg-white/80",
                      )}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, imageIndex) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setIndex(imageIndex)}
                  aria-label={t("imageOf", { number: imageIndex + 1, total: images.length })}
                  className={cn(
                    "aspect-square overflow-hidden rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    imageIndex === active
                      ? "border-primary"
                      : "border-outline-variant hover:border-outline-hover",
                  )}
                >
                  <MediaImage src={image} alt="" wrapperClassName="h-full w-full" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center justify-between gap-space-sm">
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

          <div className="flex flex-col gap-space-sm rounded-[1.25rem] border border-outline-variant bg-surface-container p-space-md">
            <div className="flex items-center gap-2 font-label-lg text-label-lg font-semibold text-primary">
              <Icon name="info" className="text-lg" />
              <span>{t("howToOrderTitle")}</span>
            </div>
            <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
              {t("howToOrderBody")}
            </p>
          </div>

          <div className="flex flex-col gap-space-sm">
            <ConciergeActions
              contact={contact}
              emailSubject={t("emailSubject", { product: product.name })}
              whatsappMessage={t("whatsappMessage", { product: product.name })}
              labels={{
                email: t("contactCta"),
                whatsapp: t("whatsappCta"),
                unavailable: t("contactUnavailable"),
              }}
            />
          </div>
        </div>
      </div>

      {lightbox && images[active] ? (
        <div
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/90 p-space-lg"
          role="dialog"
          aria-modal="true"
          aria-label={t("imageLightbox")}
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label={t("closeImage")}
            className="absolute top-space-md right-space-md flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Icon name="close" className="text-xl" />
          </button>
          <div
            className="max-h-full max-w-4xl overflow-hidden rounded-[1.25rem]"
            onClick={(event) => event.stopPropagation()}
          >
            <MediaImage
              src={images[active]}
              alt={product.imageAlt}
              wrapperClassName="h-[85dvh] w-full max-w-4xl"
              loading="eager"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
