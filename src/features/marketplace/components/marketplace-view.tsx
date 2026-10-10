"use client";

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
  artisanPartner: "verified",
  adminCurated: "verified",
  globalLinkupOriginal: "stars",
  adminVerified: "verified",
  directTrade: "verified",
};

export function MarketplaceView() {
  const t = useTranslations("Marketplace");
  const [filter, setFilter] = useState<MarketplaceFilter>("all");
  // `selected` is intentionally retained after closing so the panel can animate
  // out with its content still mounted.
  const [selected, setSelected] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const visible = PRODUCTS.filter((product) => filter === "all" || product.category === filter);

  function openProduct(product: Product) {
    setSelected(product);
    setIsDrawerOpen(true);
  }

  return (
    <>
      {/* Editorial banner */}
      <section className="w-full border-b border-outline-variant bg-surface py-space-xl">
        <div className="mx-auto max-w-[1240px] px-margin-mobile md:px-margin">
          <div className="flex flex-col justify-between gap-space-lg md:flex-row md:items-end">
            <div className="flex max-w-3xl flex-col gap-space-sm">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border-dark bg-secondary-container-alt px-3 py-1 text-primary">
                <Icon name="verified_user" className="text-base text-tertiary" />
                <span className="font-label-caps text-label-caps tracking-wider uppercase">
                  {t("banner.badge")}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-baseline gap-x-space-md gap-y-1">
                <h1 className="font-headline-xl text-headline-xl-mobile font-semibold tracking-tight text-on-surface md:text-headline-xl">
                  {t("banner.title")}
                </h1>
                <span className="font-headline-md text-headline-md font-normal text-secondary italic">
                  / {t("banner.titleAlt")}
                </span>
              </div>

              <p className="max-w-2xl font-body-lg text-body-lg leading-relaxed text-on-surface-strong">
                {t("banner.intro")}
              </p>

              <div className="mt-2 flex items-center gap-2 font-body-sm text-body-sm text-secondary">
                <Icon name="lock" className="text-sm text-tertiary" />
                <span>{t("banner.note")}</span>
              </div>
            </div>

            <div className="flex min-w-[260px] items-center gap-space-md self-start rounded-xl border border-outline-variant bg-surface-low p-space-md shadow-sm md:self-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-outline-variant bg-surface-variant text-primary">
                <Icon name="approval_delegation" className="text-2xl" />
              </div>
              <div>
                <div className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("banner.statTitle")}
                </div>
                <div className="font-label-md text-label-md text-secondary">
                  {t("banner.statSubtitle")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="w-full bg-background py-space-lg">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-space-md px-margin-mobile md:px-margin">
          <div className="flex flex-col items-stretch justify-between gap-space-md md:flex-row md:items-center">
            <div className="relative max-w-xl flex-1">
              <Icon
                name="search"
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-xl text-secondary"
              />
              <input
                type="text"
                placeholder={t("controls.searchPlaceholder")}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-low pr-4 pl-11 font-body-md text-body-md text-on-surface transition-all placeholder:text-secondary focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between gap-space-sm md:justify-end">
              <span className="font-label-md text-label-md whitespace-nowrap text-secondary">
                {t("controls.sortBy")}
              </span>
              <div className="relative">
                <select
                  defaultValue="featured"
                  className="h-11 cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-low pr-8 pl-3.5 font-label-lg text-label-lg text-on-surface transition-all focus:border-primary focus:outline-none"
                >
                  <option value="featured">{t("controls.sortFeatured")}</option>
                  <option value="price-low">{t("controls.sortPriceLow")}</option>
                  <option value="price-high">{t("controls.sortPriceHigh")}</option>
                  <option value="newest">{t("controls.sortNewest")}</option>
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-base text-secondary"
                />
              </div>
            </div>
          </div>

          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            {MARKETPLACE_FILTERS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={cn(
                  "rounded-lg px-4 py-1.5 font-label-md text-label-md whitespace-nowrap transition-all",
                  filter === key
                    ? "border border-primary bg-secondary-container-alt font-semibold text-on-surface"
                    : "border border-outline-variant bg-surface-low text-on-surface-strong hover:border-secondary",
                )}
              >
                {key === "all" ? t("filters.all", { count: PRODUCTS.length }) : t(`filters.${key}`)}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Product grid */}
      <section className="w-full bg-background pb-space-xl">
        <div className="mx-auto max-w-[1240px] px-margin-mobile md:px-margin">
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={() => openProduct(product)} />
            ))}
          </div>

          {/* No-cart model notice */}
          <div className="mt-space-xl flex flex-col items-center justify-between gap-space-md rounded-xl border border-outline-variant bg-surface-low p-space-lg text-center shadow-sm md:flex-row md:text-left">
            <div className="flex items-center gap-space-md">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-dark bg-secondary-container-alt text-primary">
                <Icon name="handshake" className="text-2xl" />
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                  {t("notice.title")}
                </h3>
                <p className="max-w-xl font-body-sm text-body-sm text-secondary">
                  {t("notice.body")}
                </p>
              </div>
            </div>
            <a
              href={`mailto:${MARKETPLACE_CONTACT.email}`}
              className="rounded-lg border border-outline-variant bg-surface-container px-5 py-2.5 font-label-lg text-label-lg whitespace-nowrap text-on-surface transition-colors hover:border-border-dark hover:bg-surface-variant"
            >
              {t("notice.cta")}
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

function ProductCard({ product, onOpen }: { product: Product; onOpen: () => void }) {
  const t = useTranslations("Marketplace");
  const isOriginal = product.badge === "globalLinkupOriginal";

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-outline-variant bg-surface-low transition-all duration-300 hover:border-border-dark hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={product.imageAlt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={product.image}
          loading="lazy"
        />

        <div
          className={cn(
            "absolute top-3 left-3 flex items-center gap-1.5 rounded px-2.5 py-1 font-label-caps text-label-caps font-bold tracking-wider uppercase",
            isOriginal
              ? "bg-primary-container font-semibold text-white shadow-sm"
              : "border border-outline-variant bg-surface-low/90 text-tertiary shadow-sm backdrop-blur-sm",
          )}
        >
          <Icon name={BADGE_ICONS[product.badge]} className="text-sm" />
          <span>{t(`badges.${product.badge}`)}</span>
        </div>

        <div className="absolute top-3 right-3 rounded border border-outline-variant bg-background/85 px-2 py-0.5 font-label-caps text-label-caps text-on-surface-strong backdrop-blur-sm">
          {product.originLabel}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-space-lg">
        <div className="flex flex-col gap-1">
          <span className="font-label-caps text-label-caps tracking-wider text-secondary uppercase">
            {t(`categories.${product.category}`)}
          </span>
          <h2 className="line-clamp-1 font-headline-sm text-headline-sm font-semibold text-on-surface transition-colors group-hover:text-primary-container">
            {product.name}
          </h2>
          <p className="mt-1 line-clamp-2 font-body-sm text-body-sm text-secondary">
            {product.summary}
          </p>
        </div>

        <div className="mt-space-md flex items-center justify-between border-t border-outline-variant pt-space-md">
          <div>
            <span className="block font-label-caps text-label-caps text-secondary">
              {t("card.priceLabel")}
            </span>
            <span className="font-headline-sm text-headline-sm font-bold text-on-surface">
              ${product.price} {t("drawer.currencyUsd")}
            </span>
          </div>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="flex items-center gap-1 rounded-lg border border-border-dark bg-secondary-container-alt px-3.5 py-1.5 font-label-md text-label-md font-semibold text-on-surface-strong transition-colors hover:bg-primary-container hover:text-white"
          >
            {t("card.inspectSpecs")}
            <Icon name="arrow_forward" className="text-sm" />
          </button>
        </div>
      </div>
    </article>
  );
}
