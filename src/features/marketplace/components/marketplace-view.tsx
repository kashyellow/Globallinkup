"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import {
  MARKETPLACE_CONTACT,
  MARKETPLACE_FILTERS,
  PRODUCTS,
  type MarketplaceBadge,
  type MarketplaceFilter,
  type Product,
} from "../data";
import { ProductDrawer } from "./product-drawer";

const BADGE_ICONS: Record<MarketplaceBadge, string> = {
  artisanPartner: "handyman",
  adminCurated: "verified",
  globalLinkupOriginal: "stars",
  adminVerified: "verified",
  directTrade: "handshake",
};

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function MarketplaceView() {
  const t = useTranslations("Marketplace");
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  // `selected` is intentionally retained after closing so the panel can animate
  // out with its content still mounted.
  const [selected, setSelected] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const visible = PRODUCTS.filter((product) => filter === "all" || product.category === filter);
  // The first card in the "all" view carries the featured treatment. When a
  // category filter is active the set is small, so every tile stays compact.
  const featuredId = filter === "all" ? visible[0]?.id : undefined;

  function openProduct(product: Product) {
    setSelected(product);
    setIsDrawerOpen(true);
  }

  return (
    <>
      {/* Editorial header */}
      <section className="border-b border-outline-variant bg-surface-low">
        <div className="mx-auto max-w-[1240px] px-margin-mobile pt-block-mobile pb-space-xl md:px-margin md:pt-block">
          <div className="flex flex-col justify-between gap-space-lg lg:flex-row lg:items-end">
            <div className="flex max-w-3xl flex-col gap-space-sm">
              <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
                {t("banner.badge")}
              </p>

              <h1 className="font-display-md text-display-md-mobile font-bold text-balance text-on-surface md:text-display-md">
                {t("banner.title")}
              </h1>

              <p className="max-w-[58ch] font-body-lg text-body-lg text-pretty text-on-surface-variant">
                {t("banner.intro")}
              </p>
            </div>

            <div className="shrink-0 self-start bezel-tray lg:self-auto">
              <div
                className="flex items-center gap-space-md bezel-core px-space-md py-space-sm"
                style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Icon name="approval_delegation" className="text-xl" />
                </span>
                <div>
                  <div className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("banner.statTitle")}
                  </div>
                  <div className="font-body-sm text-body-sm text-secondary">
                    {t("banner.statSubtitle")}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-space-lg flex items-center gap-2 font-body-sm text-body-sm text-secondary">
            <Icon name="lock" className="shrink-0 text-base text-tertiary" />
            <span>{t("banner.note")}</span>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="mx-auto max-w-[1240px] px-margin-mobile py-space-lg md:px-margin">
        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col items-stretch justify-between gap-space-md md:flex-row md:items-center">
            <div className="relative max-w-xl flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl text-text-muted"
              />
              <input
                type="text"
                placeholder={t("controls.searchPlaceholder")}
                className="h-12 w-full rounded-full border border-outline-variant bg-surface-low pr-4 pl-12 font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </div>

            <div className="flex items-center justify-between gap-space-sm md:justify-end">
              <label
                htmlFor="marketplace-sort"
                className="font-label-lg text-label-lg whitespace-nowrap text-secondary"
              >
                {t("controls.sortBy")}
              </label>
              <div className="relative">
                <select
                  id="marketplace-sort"
                  defaultValue="featured"
                  className={cn(
                    "h-12 cursor-pointer appearance-none rounded-full border border-outline-variant bg-surface-low pr-10 pl-4 font-label-lg text-label-lg text-on-surface transition-colors duration-300 hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                    EASE,
                  )}
                >
                  <option value="featured">{t("controls.sortFeatured")}</option>
                  <option value="price-low">{t("controls.sortPriceLow")}</option>
                  <option value="price-high">{t("controls.sortPriceHigh")}</option>
                  <option value="newest">{t("controls.sortNewest")}</option>
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-base text-secondary"
                />
              </div>
            </div>
          </div>

          <div className="-mx-margin-mobile no-scrollbar flex items-center gap-2 overflow-x-auto px-margin-mobile md:mx-0 md:px-0">
            {MARKETPLACE_FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
                className={cn(
                  "min-h-9 shrink-0 rounded-full px-4 py-1.5 font-label-lg text-label-lg whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                  EASE,
                  filter === key
                    ? "bg-primary font-semibold text-on-primary"
                    : "border border-outline-variant bg-surface-low text-on-surface-variant hover:border-outline-hover hover:bg-surface-container hover:text-on-surface",
                )}
              >
                {key === "all" ? t("filters.all", { count: PRODUCTS.length }) : t(`filters.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog. An asymmetric bento rather than an even 3-up grid, so the
          catalogue reads as an editorial selection instead of a product wall. */}
      <section className="mx-auto max-w-[1240px] px-margin-mobile pb-page-mobile md:px-margin md:pb-page">
        <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 lg:grid-cols-6">
          {visible.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              productIndex={index}
              featured={product.id === featuredId}
              onOpen={() => openProduct(product)}
            />
          ))}
        </div>

        {/* No-cart model notice */}
        <div className="mt-block-mobile bezel-tray md:mt-block">
          <div
            className="flex flex-col items-start justify-between gap-space-md bezel-core p-space-lg md:flex-row md:items-center"
            style={{ "--bezel-core-bg": "var(--color-surface-container)" } as CSSProperties}
          >
            <div className="flex items-start gap-space-md">
              <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary sm:flex">
                <Icon name="handshake" className="text-2xl" />
              </span>
              <div>
                <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("notice.title")}
                </h2>
                <p className="mt-1 max-w-xl font-body-sm text-body-sm text-pretty text-secondary">
                  {t("notice.body")}
                </p>
              </div>
            </div>
            <a
              href={`mailto:${MARKETPLACE_CONTACT.email}`}
              className={cn(
                "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-outline bg-surface-low px-5 font-label-lg text-label-lg whitespace-nowrap text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
              )}
            >
              {t("notice.cta")}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-surface/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <Icon name="north_east" className="text-[15px]" />
              </span>
            </a>
          </div>
        </div>
      </section>

      <ProductDrawer
        product={selected}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

function ProductCard({
  product,
  productIndex,
  featured,
  onOpen,
}: {
  product: Product;
  productIndex: number;
  featured: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("Marketplace");
  const isOriginal = product.badge === "globalLinkupOriginal";

  return (
    <article
      className={cn(
        "group flex flex-col",
        /*
         * Asymmetric bento spans on a 6-column track. The featured tile takes a
         * 4-wide, 2-row block; the rest mix 2-wide and 3-wide cells so no row
         * resolves into a set of equal-width cards.
         */
        featured
          ? "lg:col-span-4 lg:row-span-2"
          : productIndex % 3 === 1
            ? "lg:col-span-2"
            : "lg:col-span-3",
      )}
    >
      <div className={cn("flex h-full bezel-tray", featured && "lg:h-auto")}>
        <div
          className="flex w-full flex-col overflow-hidden bezel-core"
          style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
        >
          <button
            type="button"
            onClick={onOpen}
            aria-label={t("card.inspectSpecs")}
            className="relative block w-full overflow-hidden bg-surface-container focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
          >
            <span className={cn("block w-full", featured ? "aspect-[16/11]" : "aspect-[4/3]")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt={product.imageAlt}
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
                src={product.image}
                loading="lazy"
              />
            </span>

            {/*
             * Solid tinted surfaces rather than `backdrop-blur`: these sit in
             * normal flow over a photo, and blur is reserved for fixed/sticky
             * chrome.
             */}
            <span
              className={cn(
                "absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label-md text-label-md shadow-lift-sm",
                isOriginal
                  ? "bg-primary text-on-primary"
                  : "border border-success-border bg-success-surface text-success-text",
              )}
            >
              <Icon name={BADGE_ICONS[product.badge]} className="text-sm" />
              {t(`badges.${product.badge}`)}
            </span>

            <span className="absolute top-3 right-3 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
              {product.originLabel}
            </span>
          </button>

          <div className="flex flex-1 flex-col justify-between gap-space-sm p-space-md">
            <div className="flex flex-col gap-1">
              <span className="font-label-md text-label-md font-semibold text-primary">
                {t(`categories.${product.category}`)}
              </span>
              <h2
                className={cn(
                  "font-semibold text-balance text-on-surface transition-colors duration-300 group-hover:text-primary",
                  featured
                    ? "line-clamp-2 font-headline-md text-headline-md"
                    : "line-clamp-2 font-headline-sm text-headline-sm",
                )}
              >
                {product.name}
              </h2>
              <p
                className={cn(
                  "mt-0.5 text-pretty text-secondary",
                  featured
                    ? "line-clamp-3 font-body-md text-body-md"
                    : "line-clamp-2 font-body-sm text-body-sm",
                )}
              >
                {product.summary}
              </p>
            </div>

            <div className="mt-space-xs flex items-center justify-between gap-space-sm border-t border-outline-variant pt-space-sm">
              <div>
                <span className="block font-label-md text-label-md text-text-muted">
                  {t("card.priceLabel")}
                </span>
                <span
                  className={cn(
                    "font-bold text-on-surface tabular-nums",
                    featured
                      ? "font-headline-md text-headline-md"
                      : "font-headline-sm text-headline-sm",
                  )}
                >
                  ${product.price} {t("drawer.currencyUsd")}
                </span>
              </div>
              <button
                type="button"
                onClick={onOpen}
                className={cn(
                  "group/btn flex h-10 items-center gap-1.5 rounded-full border border-outline bg-surface-container pr-1.5 pl-4 font-label-lg text-label-lg font-semibold whitespace-nowrap text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                  EASE,
                )}
              >
                {t("card.inspectSpecs")}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-surface/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-px">
                  <Icon name="arrow_forward" className="text-[15px]" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
