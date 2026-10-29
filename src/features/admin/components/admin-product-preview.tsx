"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";

import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";
import type { AdminProductDto } from "../queries";

/**
 * Read-only admin preview. Buyers never see this dialog; it exists so an admin
 * can confirm the gallery and listing copy before publishing or restoring.
 */
export function AdminProductPreview({
  product,
  open,
  onClose,
  onEdit,
}: {
  product: AdminProductDto | null;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("Admin.marketplace.preview");
  const tMarket = useTranslations("Admin.marketplace");
  const format = useFormatter();
  const [index, setIndex] = useState(0);
  const containerRef = useDialogA11y(open, onClose);

  const images = product?.images ?? [];
  const active = images.length > 0 ? Math.min(index, images.length - 1) : 0;

  function move(next: number) {
    if (images.length < 2) return;
    setIndex((next + images.length) % images.length);
  }

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(
        "fixed inset-0 z-[88] flex items-end justify-center bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-preview-title"
        className={cn(
          "flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        {product ? (
          <>
            <div className="flex items-start justify-between gap-space-sm border-b border-outline-variant p-space-lg">
              <div>
                <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
                  {t("eyebrow")}
                </p>
                <h2
                  id="admin-product-preview-title"
                  className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
                >
                  {product.name}
                </h2>
                <p className="mt-1 font-body-sm text-body-sm text-secondary">
                  {tMarket(
                    `status${product.status === "trashed" ? "Trash" : product.status === "unpublished" ? "Unpublished" : product.status === "draft" ? "Draft" : "Live"}`,
                  )}
                </p>
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

            <div className="grid grid-cols-1 gap-space-lg p-space-lg md:grid-cols-2">
              <div className="flex flex-col gap-space-sm">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-container">
                  <MediaImage
                    src={images[active] ?? null}
                    alt={product.name}
                    wrapperClassName="h-full w-full"
                    loading="eager"
                  />
                  {images.length > 1 ? (
                    <>
                      <button
                        type="button"
                        onClick={() => move(active - 1)}
                        aria-label={t("previousImage")}
                        className="absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <Icon name="arrow_back" className="text-xl" />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(active + 1)}
                        aria-label={t("nextImage")}
                        className="absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        <Icon name="arrow_forward" className="text-xl" />
                      </button>
                      <span className="absolute right-3 bottom-3 rounded-full bg-black/55 px-2 py-0.5 font-label-md text-label-md text-white tabular-nums">
                        {active + 1} / {images.length}
                      </span>
                    </>
                  ) : null}
                </div>
                {images.length > 1 ? (
                  <div className="grid grid-cols-5 gap-2">
                    {images.map((image, imageIndex) => (
                      <button
                        key={`${image}-${imageIndex}`}
                        type="button"
                        onClick={() => setIndex(imageIndex)}
                        aria-label={t("imageOf", { number: imageIndex + 1, total: images.length })}
                        className={cn(
                          "aspect-square overflow-hidden rounded-lg border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
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

              <div className="flex flex-col gap-space-md">
                <div>
                  <p className="font-label-md text-label-md text-text-muted">{t("price")}</p>
                  <p className="font-headline-md text-headline-md font-bold text-on-surface tabular-nums">
                    {product.price}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-text-muted">{t("origin")}</p>
                  <p className="font-body-md text-body-md text-on-surface-strong">
                    {product.origin || "—"}
                  </p>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-text-muted">{t("description")}</p>
                  <p className="font-body-sm text-body-sm leading-relaxed text-on-surface-strong">
                    {product.description || "—"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-space-sm border-t border-outline-variant pt-space-sm font-body-sm text-body-sm text-secondary">
                  <div>
                    <p className="text-text-muted">{t("created")}</p>
                    <p className="text-on-surface-strong" suppressHydrationWarning>
                      {format.dateTime(new Date(product.createdAt), "dayMonth")}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-muted">{t("published")}</p>
                    <p className="text-on-surface-strong" suppressHydrationWarning>
                      {product.publishedAt
                        ? format.dateTime(new Date(product.publishedAt), "dayMonth")
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-space-sm border-t border-outline-variant p-space-lg sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-low px-5 font-label-md text-label-md font-semibold text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("close")}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <Icon name="edit" className="text-base" />
                {t("edit")}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
