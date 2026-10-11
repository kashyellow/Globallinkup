"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { ADMIN_PRODUCTS, PRODUCT_CATEGORY_KEYS, type AdminProduct } from "../data";

const ACTION_BASE =
  "inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 py-2 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px";

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
    <div className="flex flex-col gap-space-lg">
      <div className="flex flex-col justify-between gap-space-md sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-admin-border bg-admin-surface px-2.5 py-0.5 font-label-md text-label-md font-semibold text-admin-text">
              {t("restrictedAccess")}
            </span>
            <span className="font-label-md text-label-md text-secondary">
              {t("curatedCatalog")}
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md font-semibold text-on-surface">
            {t("title")}
          </h2>
          <p className="mt-1 font-body-sm text-body-sm text-secondary">{t("body")}</p>
        </div>
        <button
          type="button"
          onClick={focusDrawer}
          className={cn(
            ACTION_BASE,
            "self-start bg-primary text-on-primary hover:bg-primary-hover sm:self-auto",
          )}
        >
          <Icon name="add_shopping_cart" className="text-lg" />
          <span>{t("addProduct")}</span>
        </button>
      </div>

      <div
        className="bezel-tray"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="overflow-hidden bezel-core">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant bg-surface-dim">
                  {(["item", "price", "category", "status", "inquiries", "actions"] as const).map(
                    (key) => (
                      <th
                        key={key}
                        className={cn(
                          "p-space-md font-label-md text-label-md font-semibold whitespace-nowrap text-secondary",
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
      </div>

      <div
        ref={drawerRef}
        className={cn(
          "bezel-tray transition-shadow duration-500 motion-reduce:transition-none",
          highlight && "ring-2 ring-primary",
        )}
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col gap-space-lg bezel-core p-space-lg">
          <div className="flex flex-col items-start justify-between gap-space-sm border-b border-outline-variant pb-space-md sm:flex-row">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-admin-border bg-admin-surface text-admin-text">
                <Icon name="post_add" className="text-lg" />
              </span>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("form.title")}
                </h3>
                <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{t("form.body")}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-admin-border bg-admin-surface px-space-sm py-1 font-label-md text-label-md text-admin-text-soft">
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
              <label className="font-label-md text-label-md font-semibold text-on-surface">
                {t("form.narrative")}
              </label>
              <textarea
                rows={3}
                defaultValue={t("form.defaultNarrative")}
                placeholder={t("form.narrativePlaceholder")}
                className={textareaClass}
              />
            </div>

            <div className="flex flex-col items-center justify-between gap-space-md border-t border-outline-variant pt-space-md sm:flex-row md:col-span-2">
              <div className="flex items-center gap-space-sm">
                <Icon name="check_circle" className="text-success-text" />
                <span className="font-body-sm text-body-sm text-secondary">
                  {t("form.instantRelease")}
                </span>
              </div>
              <div className="flex w-full flex-wrap items-center justify-end gap-space-sm sm:w-auto">
                <button
                  type="button"
                  className={cn(
                    ACTION_BASE,
                    "border border-outline-variant bg-surface-dim text-on-surface hover:border-outline-hover hover:bg-surface-container",
                  )}
                >
                  {t("form.saveDraft")}
                </button>
                <button
                  type="submit"
                  className={cn(ACTION_BASE, "bg-primary text-on-primary hover:bg-primary-hover")}
                >
                  {t("form.publish")}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const FIELD_BASE =
  "w-full border border-outline-variant bg-surface-dim font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-placeholder hover:border-outline-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

const inputClass = cn(FIELD_BASE, "h-11 rounded-full px-space-md");

const textareaClass = cn(FIELD_BASE, "resize-y rounded-2xl px-space-md py-3");

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-md text-label-md font-semibold text-on-surface">{label}</label>
      {children}
    </div>
  );
}

function ProductRow({ product }: { product: AdminProduct }) {
  const t = useTranslations("Admin.marketplace");

  return (
    <tr className="transition-colors duration-300 hover:bg-surface-container">
      <td className="p-space-md">
        <div className="flex items-center gap-space-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt={product.imageAlt}
            className="h-14 w-14 shrink-0 rounded-2xl border border-outline-variant object-cover"
            src={product.image}
            loading="lazy"
          />
          <div>
            <h4 className="font-label-lg text-label-lg font-semibold text-on-surface">
              {product.name}
            </h4>
            <p className="mt-0.5 font-body-sm text-body-sm text-secondary">{product.origin}</p>
          </div>
        </div>
      </td>
      <td className="p-space-md font-label-lg text-label-lg font-semibold whitespace-nowrap text-on-surface tabular-nums">
        {product.price}
      </td>
      <td className="p-space-md">
        <span className="rounded-full border border-outline-variant bg-surface-container px-2.5 py-1 font-label-md text-label-md whitespace-nowrap text-secondary">
          {t(`categories.${product.categoryKey}`)}
        </span>
      </td>
      <td className="p-space-md">
        {product.status === "live" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-surface px-2.5 py-1 font-label-md text-label-md font-semibold whitespace-nowrap text-success-text">
            <span className="h-1.5 w-1.5 rounded-full bg-success-bright" />
            {t("statusLive")}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-admin-border bg-admin-surface px-2.5 py-1 font-label-md text-label-md whitespace-nowrap text-admin-text-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("statusReserved")}
          </span>
        )}
      </td>
      <td className="p-space-md">
        <span className="block font-label-md text-label-md font-semibold whitespace-nowrap text-on-surface tabular-nums">
          {t("inquiries", { count: product.inquiries })}
        </span>
        <span className="mt-0.5 block font-body-sm text-body-sm whitespace-nowrap text-secondary">
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
      aria-label={title}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-300 active:translate-y-px",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        danger
          ? "text-secondary hover:bg-danger-surface hover:text-danger focus-visible:outline-danger-border-strong"
          : "text-secondary hover:bg-surface-container hover:text-on-surface",
      )}
    >
      <Icon name={icon} className="text-lg" />
    </button>
  );
}
