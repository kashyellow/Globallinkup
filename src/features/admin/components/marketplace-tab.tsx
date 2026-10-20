"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  createProductAction,
  deleteProductAction,
  setProductPublishedAction,
  updateProductAction,
} from "@/features/admin/actions";
import { uploadImageAction } from "@/features/media/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AdminProductDto } from "../queries";

const INPUT =
  "h-11 w-full rounded-full border border-outline-variant bg-surface-dim px-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const LABEL = "font-label-md text-label-md font-semibold text-on-surface";

export function AdminMarketplaceTab({ products }: { products: AdminProductDto[] }) {
  const t = useTranslations("Admin.marketplace");
  const router = useRouter();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [origin, setOrigin] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function pickPhoto(file: File | null) {
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPrice("");
    setOrigin("");
    setPhone("");
    setDescription("");
    pickPhoto(null);
    setPublishNow(false);
    setError(null);
  }

  function startEdit(product: AdminProductDto) {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price.replace(/[^0-9.]/g, ""));
    setOrigin(product.origin);
    setPhone(product.phone);
    setDescription(product.description);
    setPublishNow(product.isPublished);
    pickPhoto(null);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim() === "" || busy) return;

    const amount = Number(price.trim().replace(",", ".") || "0");
    if (!Number.isFinite(amount) || amount < 0) {
      setError(t("errorInvalid"));
      return;
    }

    setBusy(true);
    setError(null);

    let imagePath: string | undefined;
    if (photoFile) {
      const formData = new FormData();
      formData.set("bucket", "product-images");
      formData.set("file", photoFile);
      const upload = await uploadImageAction(formData);
      if (!upload.ok) {
        setBusy(false);
        setError(t("errorInvalid"));
        return;
      }
      imagePath = upload.path;
    }

    const payload = {
      name: name.trim(),
      priceCents: Math.round(amount * 100),
      currency: "USD",
      originLabel: origin.trim(),
      sellerPhone: phone.trim(),
      description: description.trim(),
      isPublished: publishNow,
      imagePath,
    };

    const result = editingId
      ? await updateProductAction({ ...payload, productId: editingId })
      : await createProductAction(payload);

    setBusy(false);
    if (!result.ok) {
      setError(t("errorInvalid"));
      return;
    }

    resetForm();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Create / edit form */}
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <form
          onSubmit={(event) => void submit(event)}
          className="flex flex-col gap-space-md bezel-core p-space-lg"
        >
          <div className="flex flex-wrap items-start justify-between gap-space-sm">
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                {editingId ? t("editTitle") : t("form.title")}
              </h2>
              <p className="mt-0.5 font-body-sm text-body-sm text-secondary">
                {editingId ? t("editBody") : t("form.body")}
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-11 items-center rounded-full border border-outline-variant px-4 font-label-md text-label-md text-secondary transition-colors hover:bg-surface-container hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {t("cancelEdit")}
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("form.productTitle")}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t("form.productTitlePlaceholder")}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("form.price")}</span>
              <input
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                inputMode="decimal"
                placeholder="0.00"
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("origin")}</span>
              <input
                value={origin}
                onChange={(event) => setOrigin(event.target.value)}
                placeholder={t("originPlaceholder")}
                className={INPUT}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("form.phone")}</span>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                inputMode="tel"
                placeholder={t("form.phonePlaceholder")}
                className={INPUT}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>{t("form.narrative")}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder={t("form.narrativePlaceholder")}
              className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-danger-border bg-danger-surface px-space-md py-2 font-body-sm text-body-sm text-danger-text"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <label className="flex cursor-pointer items-center gap-space-sm">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(event) => setPublishNow(event.target.checked)}
                className="h-6 w-6 cursor-pointer rounded border-outline-variant bg-surface accent-primary"
              />
              <span className="font-body-sm text-body-sm text-secondary">
                {t("form.instantRelease")}
              </span>
            </label>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-80"
            >
              <Icon
                name={busy ? "progress_activity" : editingId ? "save" : "add"}
                className={cn("text-lg", busy && "animate-spin")}
              />
              {editingId ? t("update") : publishNow ? t("form.publish") : t("form.saveDraft")}
            </button>
          </div>
        </form>
      </div>

      {/* Product photo — its own panel, not a field inside the form above. */}
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col items-start gap-space-md bezel-core p-space-lg sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-variant text-secondary">
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={photoPreview} className="h-full w-full object-cover" />
            ) : (
              <Icon name="image" className="text-2xl" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {t("form.image")}
            </h2>
            <p className="mt-0.5 truncate font-body-sm text-body-sm text-secondary">
              {photoFile ? photoFile.name : t("form.imageHint")}
            </p>
          </div>
          <label
            className={cn(
              "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors duration-300",
              "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:border-outline-hover hover:bg-surface-container",
            )}
          >
            <Icon name="add_photo_alternate" className="text-lg text-primary" />
            <span>{photoFile ? t("form.imageReplace") : t("form.imageUpload")}</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(event) => pickPhoto(event.target.files?.[0] ?? null)}
            />
          </label>
        </div>
      </div>

      {/* Catalog */}
      {products.length === 0 ? (
        <div className="bezel-tray">
          <div
            className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
            style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
          >
            <Icon name="storefront" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-space-sm">
          {products.map((product) => (
            <ProductRow key={product.id} product={product} onEdit={() => startEdit(product)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product, onEdit }: { product: AdminProductDto; onEdit: () => void }) {
  const t = useTranslations("Admin.marketplace");
  const router = useRouter();

  async function toggle() {
    const result = await setProductPublishedAction({
      productId: product.id,
      isPublished: !product.isPublished,
    });
    if (result.ok) router.refresh();
  }

  async function remove() {
    const result = await deleteProductAction({ productId: product.id });
    if (result.ok) router.refresh();
  }

  return (
    <div
      className="bezel-tray"
      style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
    >
      <div className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-space-md">
          {product.image ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.name}
                className="h-14 w-14 shrink-0 rounded-xl border border-outline-variant object-cover"
                src={product.image}
                loading="lazy"
              />
            </>
          ) : (
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-variant text-secondary">
              <Icon name="image" />
            </span>
          )}
          <div className="min-w-0">
            <h3 className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
              {product.name}
            </h3>
            <p className="truncate font-body-sm text-body-sm text-secondary">
              {[product.origin, product.price, product.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          <span
            className={cn(
              "rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold",
              product.isPublished
                ? "border-success-border bg-success-surface text-success-text"
                : "border-outline-variant bg-surface-container text-secondary",
            )}
          >
            {product.isPublished ? t("statusLive") : t("statusReserved")}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            {t("edit")}
          </button>
          <button
            type="button"
            onClick={() => void toggle()}
            className="inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
          >
            {product.isPublished ? t("unpublish") : t("publish")}
          </button>
          <button
            type="button"
            onClick={() => void remove()}
            title={t("delete")}
            aria-label={t("delete")}
            className="flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Icon name="delete" className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}
