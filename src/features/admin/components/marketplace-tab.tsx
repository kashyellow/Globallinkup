"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import {
  createProductAction,
  deleteProductAction,
  restoreProductAction,
  setProductPublishedAction,
  updateProductAction,
} from "@/features/admin/actions";
import { AdminPagination } from "@/features/admin/components/admin-pagination";
import { AdminSearchForm } from "@/features/admin/components/admin-search-form";
import { AdminStatusLinks } from "@/features/admin/components/admin-status-links";
import { uploadImageAction } from "@/features/media/actions";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";
import type { AdminProductDto, AdminProductFilter, AdminProductStatus } from "../queries";
import { AdminProductPreview } from "./admin-product-preview";

const INPUT =
  "h-11 w-full rounded-full border border-outline-variant bg-surface-dim px-space-md font-body-sm text-body-sm text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const LABEL = "font-label-md text-label-md font-semibold text-on-surface";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGES = 10;

const STATUS_KEY: Record<AdminProductStatus, string> = {
  live: "statusLive",
  draft: "statusDraft",
  unpublished: "statusUnpublished",
  trashed: "statusTrash",
};

export function AdminMarketplaceTab({
  products,
  query,
  status,
  page,
  total,
  totalPages,
}: {
  products: AdminProductDto[];
  query: string;
  status: AdminProductFilter;
  page: number;
  total: number;
  totalPages: number;
}) {
  const t = useTranslations("Admin.marketplace");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProductDto | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AdminProductDto | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<AdminProductDto | null>(null);
  const [previewTarget, setPreviewTarget] = useState<AdminProductDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = [
    { value: "all", label: t("filterAll") },
    { value: "live", label: t("statusLive") },
    { value: "draft", label: t("statusDraft") },
    { value: "unpublished", label: t("statusUnpublished") },
    { value: "trashed", label: t("statusTrash") },
  ];

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(product: AdminProductDto) {
    setEditing(product);
    setFormOpen(true);
  }

  async function togglePublished(product: AdminProductDto) {
    await run(`publish:${product.id}`, async () => {
      setError(null);
      try {
        const result = await setProductPublishedAction({
          productId: product.id,
          isPublished: !product.isPublished,
        });
        if (!result.ok) {
          setError(tCommon("actionError"));
          return;
        }
        refresh();
      } catch {
        setError(tCommon("actionError"));
      }
    });
  }

  async function trashProduct(product: AdminProductDto) {
    const result = await run(`delete:${product.id}`, async () => {
      setError(null);
      try {
        const response = await deleteProductAction({ productId: product.id });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });
    if (result) setConfirmTarget(null);
  }

  async function restoreProduct(product: AdminProductDto) {
    const result = await run(`restore:${product.id}`, async () => {
      setError(null);
      try {
        const response = await restoreProductAction({ productId: product.id });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });
    if (result) setRestoreTarget(null);
  }

  return (
    <div className="mx-auto w-full max-w-[1240px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <div className="flex flex-col justify-between gap-space-md lg:flex-row lg:items-end">
        <div>
          <p className="font-label-md text-label-md font-semibold text-primary">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display-md text-display-md-mobile text-on-surface md:text-display-md">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-[62ch] font-body-md text-body-md text-secondary">{t("body")}</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px lg:self-auto"
        >
          <Icon name="add" className="text-lg" />
          {t("newProduct")}
        </button>
      </div>

      <div className="mt-space-lg bezel-tray">
        <div className="flex flex-col gap-space-md bezel-core p-space-md md:p-space-lg">
          <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
            <AdminSearchForm
              basePath="/admin/marketplace"
              query={query}
              status={status}
              placeholder={t("searchPlaceholder")}
            />
            <AdminStatusLinks
              basePath="/admin/marketplace"
              current={status}
              options={statusOptions}
              query={query}
            />
          </div>
          <p className="font-label-md text-label-md text-secondary">
            {t("resultsCount", { shown: products.length, total })}
          </p>
        </div>
      </div>

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}

      {products.length === 0 ? (
        <div className="mt-space-lg bezel-tray">
          <div className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center">
            <Icon name="storefront" className="text-3xl text-secondary" />
            <p className="font-label-lg text-label-lg font-semibold text-on-surface">
              {t("emptyTitle")}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-space-lg flex flex-col gap-space-sm">
          {products.map((product) => (
            <ProductRow
              key={product.id}
              product={product}
              pending={
                isPending(`publish:${product.id}`) ||
                isPending(`delete:${product.id}`) ||
                isPending(`restore:${product.id}`)
              }
              onEdit={() => openEdit(product)}
              onPreview={() => setPreviewTarget(product)}
              onToggle={() => void togglePublished(product)}
              onTrash={() => setConfirmTarget(product)}
              onRestore={() => setRestoreTarget(product)}
            />
          ))}
        </div>
      )}

      <AdminPagination
        basePath="/admin/marketplace"
        page={page}
        totalPages={totalPages}
        query={query}
        status={status}
      />

      {previewTarget ? (
        <AdminProductPreview
          product={previewTarget}
          open
          onClose={() => setPreviewTarget(null)}
          onEdit={() => {
            setPreviewTarget(null);
            openEdit(previewTarget);
          }}
        />
      ) : null}

      {formOpen ? (
        <ProductFormDialog
          key={editing?.id ?? "new"}
          product={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            refresh();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmTarget !== null}
        title={t("delete")}
        body={t("trashBody")}
        confirmLabel={t("trash")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={confirmTarget ? isPending(`delete:${confirmTarget.id}`) : false}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          if (confirmTarget) void trashProduct(confirmTarget);
        }}
      />

      <ConfirmDialog
        open={restoreTarget !== null}
        title={t("restore")}
        body={t("restoreBody")}
        confirmLabel={t("restore")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={restoreTarget ? isPending(`restore:${restoreTarget.id}`) : false}
        tone="primary"
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => {
          if (restoreTarget) void restoreProduct(restoreTarget);
        }}
      />
    </div>
  );
}

function StatusChip({ status }: { status: AdminProductStatus }) {
  const t = useTranslations("Admin.marketplace");
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 font-label-md text-label-md font-semibold",
        status === "live"
          ? "border-success-border bg-success-surface text-success-text"
          : status === "unpublished"
            ? "border-primary/30 bg-primary/10 text-primary"
            : status === "trashed"
              ? "border-danger-border bg-danger-surface text-danger-text"
              : "border-outline-variant bg-surface-container text-secondary",
      )}
    >
      {t(STATUS_KEY[status])}
    </span>
  );
}

function ProductRow({
  product,
  pending,
  onEdit,
  onPreview,
  onToggle,
  onTrash,
  onRestore,
}: {
  product: AdminProductDto;
  pending: boolean;
  onEdit: () => void;
  onPreview: () => void;
  onToggle: () => void;
  onTrash: () => void;
  onRestore: () => void;
}) {
  const t = useTranslations("Admin.marketplace");

  return (
    <div className="bezel-tray" data-product-name={product.name}>
      <div className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-md sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-space-md">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={product.name}
              className="h-16 w-16 shrink-0 rounded-xl border border-outline-variant object-cover"
              src={product.image}
              loading="lazy"
            />
          ) : (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-outline-variant bg-surface-variant text-secondary">
              <Icon name="image" />
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate font-headline-sm text-headline-sm font-semibold text-on-surface">
                {product.name}
              </h2>
              <StatusChip status={product.status} />
              {product.imagePaths.length > 1 ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 font-label-md text-label-md text-secondary">
                  <Icon name="photo_library" className="text-sm" />
                  {product.imagePaths.length}
                </span>
              ) : null}
            </div>
            <p className="truncate font-body-sm text-body-sm text-secondary">
              {[product.origin, product.price, product.phone].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs">
          {product.status === "trashed" ? (
            <button
              type="button"
              onClick={onRestore}
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
            >
              {pending ? (
                <Spinner className="h-4 w-4 text-current" label={t("restore")} />
              ) : (
                <Icon name="restore" className="text-base" />
              )}
              {t("restore")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onPreview}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                <Icon name="visibility" className="text-base" />
                {t("previewAction")}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex min-h-11 items-center rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
              >
                {t("edit")}
              </button>
              <button
                type="button"
                onClick={onToggle}
                disabled={pending}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-dim px-4 font-label-md text-label-md text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60"
              >
                {pending ? <Spinner className="h-4 w-4 text-current" label={t("update")} /> : null}
                {product.isPublished ? t("unpublish") : t("publish")}
              </button>
              <button
                type="button"
                onClick={onTrash}
                disabled={pending}
                title={t("delete")}
                aria-label={t("delete")}
                className="flex h-11 w-11 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-variant hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
              >
                <Icon name="delete" className="text-lg" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type DraftImage = {
  path?: string;
  url: string;
  file?: File;
};

function ProductFormDialog({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProductDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("Admin.marketplace");
  const tCommon = useTranslations("Common");
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product ? (product.priceCents / 100).toFixed(2) : "");
  const [origin, setOrigin] = useState(product?.origin ?? "");
  const [phone, setPhone] = useState(product?.phone ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [publishNow, setPublishNow] = useState(product?.isPublished ?? false);
  const [images, setImages] = useState<DraftImage[]>(() =>
    product
      ? product.imagePaths.map((path, index) => ({
          path,
          url: product.images[index] ?? "",
        }))
      : [],
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const urlsRef = useRef<string[]>([]);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const containerRef = useDialogA11y(true, onClose, firstFieldRef);

  useEffect(() => {
    return () => {
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
    };
  }, []);

  function addFiles(list: FileList | null) {
    setError(null);
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    if (images.length + incoming.length > MAX_IMAGES) {
      setError(t("errorImages", { count: MAX_IMAGES }));
      return;
    }
    for (const file of incoming) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_BYTES) {
        setError(t("errorInvalid"));
        return;
      }
    }
    const next = incoming.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return { file, url };
    });
    setImages((current) => [...current, ...next]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      const target = current[index];
      if (target?.file) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
      }
      return current.filter((_, position) => position !== index);
    });
  }

  async function submit() {
    if (busy) return;
    if (name.trim().length < 2) {
      setError(t("errorInvalid"));
      firstFieldRef.current?.focus();
      return;
    }
    const amount = Number(price.trim().replace(",", ".") || "0");
    if (!Number.isFinite(amount) || amount < 0) {
      setError(t("errorInvalid"));
      return;
    }
    if (publishNow && images.length === 0) {
      setError(t("errorImageRequired"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const paths: string[] = [];
      for (const image of images) {
        if (image.path) {
          paths.push(image.path);
          continue;
        }
        if (!image.file) continue;
        const formData = new FormData();
        formData.set("bucket", "product-images");
        formData.set("file", image.file);
        const upload = await uploadImageAction(formData);
        if (!upload.ok) {
          setError(t("errorInvalid"));
          setBusy(false);
          return;
        }
        paths.push(upload.path);
      }

      const payload = {
        name: name.trim(),
        priceCents: Math.round(amount * 100),
        currency: "USD",
        originLabel: origin.trim(),
        sellerPhone: phone.trim(),
        description: description.trim(),
        isPublished: publishNow,
        imagePaths: paths,
      };

      const result = product
        ? await updateProductAction({ ...payload, productId: product.id })
        : await createProductAction(payload);

      if (!result.ok) {
        setError(t("errorInvalid"));
        return;
      }
      onSaved();
    } catch {
      setError(t("errorInvalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[85] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-space-lg"
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-title"
        className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg sm:rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-space-md border-b border-outline-variant p-space-lg">
          <div>
            <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
              {t("formEyebrow")}
            </p>
            <h2
              id="admin-product-title"
              className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {product ? t("editTitle") : t("form.title")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">
              {product ? t("editBody") : t("form.body")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label={tCommon("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={LABEL}>{t("form.productTitle")}</span>
              <input
                ref={firstFieldRef}
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
              className="w-full resize-none rounded-2xl border border-outline-variant bg-surface-dim p-space-md font-body-sm text-body-sm text-on-surface transition-colors placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

          <div className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface-container p-space-md">
            <div className="flex flex-wrap items-center justify-between gap-space-sm">
              <span className={LABEL}>{t("form.images")}</span>
              <span className="font-body-sm text-body-sm text-secondary tabular-nums">
                {t("form.imageCount", { count: images.length, max: MAX_IMAGES })}
              </span>
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {images.map((image, index) => (
                  <div
                    key={image.path ?? image.url}
                    className="relative aspect-square overflow-hidden rounded-xl border border-outline-variant bg-surface-variant"
                  >
                    {image.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={image.url} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-secondary">
                        <Icon name="image" />
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={busy}
                      aria-label={t("form.removeImage", { number: index + 1 })}
                      className="absolute top-1 right-1 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
                    >
                      <Icon name="close" className="text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-outline-variant bg-surface-dim px-4 py-2 font-label-md text-label-md text-on-surface transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:border-outline-hover hover:bg-surface-container">
              <Icon name="add_photo_alternate" className="text-lg text-primary" />
              {t("form.imageUpload")}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                disabled={busy}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

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
        </div>

        <div className="sticky bottom-0 flex flex-col gap-space-sm border-t border-outline-variant bg-surface-low p-space-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-secondary">{t("form.draftHint")}</p>
          <div className="flex items-center justify-end gap-space-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-low px-4 font-label-md text-label-md text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void submit()}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-80"
            >
              {busy ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : null}
              {product ? t("update") : publishNow ? t("form.publish") : t("form.saveDraft")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
