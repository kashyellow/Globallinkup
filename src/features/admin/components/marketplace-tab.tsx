"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ADMIN_PRODUCTS, PRODUCT_CATEGORY_KEYS, type AdminProduct } from "../data";

export function AdminMarketplaceTab() {
  const t = useTranslations("Admin.marketplace");
  const drawerRef = useRef<HTMLDivElement>(null);
  const [highlight, setHighlight] = useState(false);

  function focusDrawer() {
    drawerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlight(true);
    setTimeout(() => setHighlight(false), 1500);
  }

  return (
    <div className="flex flex-col gap-space-xl">
      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-admin-border bg-admin-surface px-2 py-0.5 font-label-caps text-label-caps font-semibold text-primary">
              {t("restrictedAccess")}
            </span>
            <span className="font-label-caps text-label-caps text-secondary uppercase">
              {t("curatedCatalog")}
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface">{t("title")}</h2>
          <p className="font-body-sm text-body-sm text-secondary">{t("body")}</p>
        </div>
        <button
          type="button"
          onClick={focusDrawer}
          className="flex items-center gap-2 self-start rounded-lg bg-primary-container px-space-md py-2.5 font-label-lg text-label-lg text-white shadow-sm transition-all hover:opacity-90 sm:self-auto"
        >
          <Icon name="add_shopping_cart" className="text-xl" />
          <span>{t("addProduct")}</span>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant bg-surface-low">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant bg-surface-dim">
                {(["item", "price", "category", "status", "inquiries", "actions"] as const).map(
                  (key) => (
                    <th
                      key={key}
                      className={cn(
                        "p-space-md font-label-caps text-label-caps text-secondary uppercase",
                        key === "actions" && "text-right",
                      )}
                    >
                      {t(`table.${key}`)}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant font-body-sm text-body-sm">
              {ADMIN_PRODUCTS.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div
        ref={drawerRef}
        className={cn(
          "flex flex-col gap-space-lg rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm transition-all",
          highlight && "ring-2 ring-primary-container",
        )}
      >
        <div className="flex items-start justify-between border-b border-outline-variant pb-space-md">
          <div className="flex items-center gap-space-sm">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-admin-border bg-admin-surface text-primary">
              <Icon name="post_add" className="text-lg" />
            </span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">
                {t("form.title")}
              </h3>
              <p className="font-body-sm text-body-sm text-secondary">{t("form.body")}</p>
            </div>
          </div>
          <span className="rounded border border-admin-border bg-admin-surface px-2.5 py-1 font-label-caps text-label-caps text-admin-text-soft">
            {t("form.adminDirectPublish")}
          </span>
        </div>

        <form
          onSubmit={(event) => event.preventDefault()}
          className="grid grid-cols-1 gap-space-md md:grid-cols-2"
        >
          <Field label={t("form.productTitle")}>
            <input
              type="text"
              defaultValue={t("form.defaultTitle")}
              placeholder={t("form.productTitlePlaceholder")}
              className={inputClass}
            />
          </Field>

          <Field label={t("form.category")}>
            <select className={inputClass} defaultValue="artisanCrafts">
              {PRODUCT_CATEGORY_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`categories.${key}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("form.price")}>
            <input type="number" step="0.01" defaultValue="120.00" className={inputClass} />
          </Field>

          <Field label={t("form.origin")}>
            <input
              type="text"
              defaultValue={t("form.defaultOrigin")}
              placeholder={t("form.originPlaceholder")}
              className={inputClass}
            />
          </Field>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="font-label-md text-label-md text-on-surface">
              {t("form.narrative")}
            </label>
            <textarea
              rows={3}
              defaultValue={t("form.defaultNarrative")}
              placeholder={t("form.narrativePlaceholder")}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col items-center justify-between gap-space-md border-t border-outline-variant pt-space-sm sm:flex-row md:col-span-2">
            <div className="flex items-center gap-space-sm">
              <Icon name="check_circle" className="text-success-bright" />
              <span className="font-body-sm text-body-sm text-secondary">
                {t("form.instantRelease")}
              </span>
            </div>
            <div className="flex w-full items-center justify-end gap-space-sm sm:w-auto">
              <button
                type="button"
                className="rounded-lg border border-outline-variant bg-surface-dim px-4 py-2 font-label-md text-label-md text-on-surface hover:bg-surface-container"
              >
                {t("form.saveDraft")}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-container px-5 py-2 font-label-md text-label-md text-white shadow-sm hover:opacity-90"
              >
                {t("form.publish")}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "rounded-lg border border-outline-variant bg-surface-dim px-3.5 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-placeholder focus:ring-1 focus:ring-primary-container focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-md text-label-md text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  const t = useTranslations("Admin.marketplace");

  return (
    <tr className="transition-colors hover:bg-surface-container">
      <td className="p-space-md">
        <div className="flex items-center gap-space-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={product.imageAlt}
            className="h-14 w-14 shrink-0 rounded-lg border border-outline-variant object-cover"
            src={product.image}
            loading="lazy"
          />
          <div>
            <h4 className="text-sm font-semibold text-on-surface">{product.name}</h4>
            <p className="text-xs text-secondary">{product.origin}</p>
          </div>
        </div>
      </td>
      <td className="p-space-md font-label-lg text-label-lg font-semibold text-on-surface">
        {product.price}
      </td>
      <td className="p-space-md">
        <span className="rounded border border-outline-variant bg-surface-container px-2.5 py-1 font-label-caps text-label-caps text-on-surface-muted">
          {t(`categories.${product.categoryKey}`)}
        </span>
      </td>
      <td className="p-space-md">
        {product.status === "live" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-container/70 px-2.5 py-0.5 font-label-caps text-label-caps font-semibold text-success-text-bright">
            <span className="h-1.5 w-1.5 rounded-full bg-success-bright" />
            {t("statusLive")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-2.5 py-0.5 font-label-caps text-label-caps text-admin-text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("statusReserved")}
          </span>
        )}
      </td>
      <td className="p-space-md">
        <span className="font-label-md text-label-md font-semibold text-on-surface">
          {t("inquiries", { count: product.inquiries })}
        </span>
        <span className="block text-xs text-secondary">
          {t(product.inquiriesMetaKey, { count: product.inquiriesMetaCount })}
        </span>
      </td>
      <td className="p-space-md text-right">
        <div className="flex items-center justify-end gap-space-xs">
          <IconButton title={t("editListing")} icon="edit" />
          <IconButton title={t("toggleVisibility")} icon="visibility" />
          <IconButton title={t("deleteFromStore")} icon="delete" danger />
        </div>
      </td>
    </tr>
  );
}

function IconButton({
  title,
  icon,
  danger = false,
}: {
  title: string;
  icon: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
        danger
          ? "text-secondary hover:bg-danger-surface/40 hover:text-danger"
          : "text-secondary hover:bg-surface-container hover:text-on-surface",
      )}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  );
}
