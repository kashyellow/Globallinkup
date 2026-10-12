"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { MARKETPLACE_CONTACT, type Product } from "../data";

export function ProductDrawer({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

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
        role="dialog"
        aria-modal="true"
        aria-label={product?.name}
        className={cn(
          "flex h-full w-full max-w-xl transform flex-col overflow-y-auto border-l border-outline-variant bg-surface-low shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {product ? <DrawerContent product={product} onClose={onClose} /> : null}
      </aside>
    </div>
  );
}

function DrawerContent({ product, onClose }: { product: Product; onClose: () => void }) {
  const t = useTranslations("Marketplace.drawer");

  const whatsappHref = `${MARKETPLACE_CONTACT.whatsappLink}?text=${encodeURIComponent(
    t("whatsappMessage", { product: product.name, sku: product.sku }),
  )}`;

  return (
    <>
      {/* Drawer header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant bg-surface-low/95 px-space-lg py-space-md backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-success-border bg-success-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-success-text">
            <Icon name="verified" className="text-xs" />
            {t("adminVerified")}
          </span>
          <span className="font-label-md text-label-md text-secondary">
            {t("sku", { sku: product.sku })}
          </span>
        </div>
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
        {/* Keying by product id resets the gallery selection without an effect. */}
        <DrawerGallery key={product.id} product={product} />

        {/* Product identity */}
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
          <p className="font-body-md text-body-md leading-relaxed text-on-surface-strong">
            {product.description}
          </p>
        </div>

        {/* Specifications */}
        <div className="flex flex-col gap-space-sm rounded-[1.25rem] border border-outline-variant bg-surface p-space-md">
          <span className="font-label-lg text-label-lg font-semibold text-on-surface">
            {t("specsTitle")}
          </span>
          <div className="grid grid-cols-2 gap-x-space-md gap-y-3 text-body-sm">
            <Spec label={t("specOrigin")} value={product.specs.origin} />
            <Spec label={t("specArtisan")} value={product.specs.artisan} />
            <Spec label={t("specMaterial")} value={product.specs.material} />
            <Spec label={t("specDimensions")} value={product.specs.dimensions} />
            <Spec label={t("specWeight")} value={product.specs.weight} />
            <Spec
              label={t("specFulfillment")}
              value={t(product.specs.fulfillment)}
              valueClassName="text-tertiary"
            />
          </div>
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
              href={`tel:${MARKETPLACE_CONTACT.whatsappNumber.replace(/\s/g, "")}`}
              className="rounded font-semibold text-on-surface transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {MARKETPLACE_CONTACT.whatsappNumber}
            </a>
          </div>
          <div className="flex items-center justify-center gap-2 font-label-md text-label-md text-secondary">
            <span>{t("emailPrefix")}</span>
            <a
              href={`mailto:${MARKETPLACE_CONTACT.email}`}
              className="rounded font-semibold text-on-surface transition-colors duration-300 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {MARKETPLACE_CONTACT.email}
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

function DrawerGallery({ product }: { product: Product }) {
  const [imageIndex, setImageIndex] = useState(0);
  const hasMultiple = product.gallery.length > 1;

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={product.galleryAlts[imageIndex]}
          className="h-full w-full object-cover"
          src={product.gallery[imageIndex]}
        />
      </div>

      {hasMultiple ? (
        <div
          className={cn(
            "grid gap-space-sm",
            product.gallery.length === 4 ? "grid-cols-4" : "grid-cols-3",
          )}
        >
          {product.gallery.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setImageIndex(index)}
              aria-label={product.galleryAlts[index]}
              className={cn(
                "aspect-[4/3] overflow-hidden rounded-[0.75rem] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                index === imageIndex
                  ? "border border-primary"
                  : "border border-outline-variant hover:border-outline-hover",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.galleryAlts[index]}
                className="h-full w-full object-cover"
                src={src}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Spec({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <span className="block font-label-md text-label-md text-text-muted">{label}</span>
      <span className={cn("font-medium text-on-surface", valueClassName)}>{value}</span>
    </div>
  );
}
