"use client";

import type { CSSProperties, ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  createProductAction,
  deleteProductAction,
  setProductPublishedAction,
} from "@/features/admin/actions";
import { uploadImageAction } from "@/features/media/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import type { AdminProductDto } from "../queries";

const CATEGORIES = [
  "artisanCrafts",
  "homeLiving",
  "booksCulture",
  "localGoods",
  "travelGear",
] as const;
const AVAILABILITY = ["in_stock", "out_of_stock", "made_to_order"] as const;

const INPUT =
  "h-11 w-full rounded-full border border-outline-variant bg-surface-dim px-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function AdminMarketplaceTab({ products }: { products: AdminProductDto[] }) {
  const t = useTranslations("Admin.marketplace");
  const router = useRouter();

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [origin, setOrigin] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("artisanCrafts");
  const [availability, setAvailability] = useState<(typeof AVAILABILITY)[number]>("in_stock");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishNow, setPublishNow] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (name.trim() === "" || busy) return;
    setBusy(true);

    let imagePath: string | undefined;
    if (file) {
      const formData = new FormData();
      formData.set("bucket", "product-images");
      formData.set("file", file);
      const upload = await uploadImageAction(formData);
      if (upload.ok) imagePath = upload.path;
    }

    const result = await createProductAction({
      name: name.trim(),
      category,
      priceCents: Math.round(Number(price || "0") * 100),
      currency: "USD",
      originLabel: origin.trim(),
      description: description.trim(),
      availability,
      isPublished: publishNow,
      imagePath,
    });

    setBusy(false);
    if (result.ok) {
      setName("");
      setPrice("");
      setOrigin("");
      setDescription("");
      setFile(null);
      setPublishNow(false);
      router.refresh();
    }
  }

  return (
    <div className="flex flex-col gap-space-lg">
      {/* Create form */}
      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <form
          onSubmit={(event) => void submit(event)}
          className="flex flex-col gap-space-md bezel-core p-space-lg"
        >
          <div>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
              {t("form.title")}
            </h2>
            <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{t("form.body")}</p>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("form.productTitlePlaceholder")}
              className={INPUT}
              aria-label={t("form.productTitle")}
            />
            <input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              inputMode="decimal"
              placeholder={t("form.price")}
              className={INPUT}
              aria-label={t("form.price")}
            />
            <input
              value={origin}
              onChange={(event) => setOrigin(event.target.value)}
              placeholder={t("origin")}
              className={INPUT}
              aria-label={t("origin")}
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as (typeof CATEGORIES)[number])}
              className={cn(INPUT, "cursor-pointer")}
              aria-label={t("table.category")}
            >
              {CATEGORIES.map((key) => (
                <option key={key} value={key}>
                  {t.has(`categories.${key}`) ? t(`categories.${key}`) : key}
                </option>
              ))}
            </select>
            <select
              value={availability}
              onChange={(event) =>
                setAvailability(event.target.value as (typeof AVAILABILITY)[number])
              }
              className={cn(INPUT, "cursor-pointer")}
              aria-label={t("availability")}
            >
              {AVAILABILITY.map((key) => (
                <option key={key} value={key}>
                  {t(`availabilityOptions.${key}`)}
                </option>
              ))}
            </select>
            <label className={cn(INPUT, "flex cursor-pointer items-center gap-2")}>
              <Icon name="add_photo_alternate" className="text-lg text-primary" />
              <span className="truncate">{file ? file.name : t("form.imageUpload")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setFile(event.target.files?.[0] ?? null)
                }
              />
            </label>
          </div>

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={3}
            placeholder={t("form.narrativePlaceholder")}
            className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            aria-label={t("form.narrative")}
          />

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
                name={busy ? "progress_activity" : "add"}
                className={cn("text-lg", busy && "animate-spin")}
              />
              {publishNow ? t("form.publish") : t("form.saveDraft")}
            </button>
          </div>
        </form>
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
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductRow({ product }: { product: AdminProductDto }) {
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
              {product.origin} · {product.price}
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
