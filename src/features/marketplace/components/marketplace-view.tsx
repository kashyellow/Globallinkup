"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { loadMarketplacePageAction } from "../actions";
import { MARKETPLACE_PAGE_SIZE, MARKETPLACE_SORTS, type MarketplaceSort } from "../constants";
import type { MarketplaceContact, MarketplaceProduct } from "../queries";
import { MarketplaceInquiryDialog } from "./marketplace-inquiry-dialog";
import { ProductDialog } from "./product-dialog";

const SORT_LABEL: Record<MarketplaceSort, string> = {
  newest: "sortNewest",
  "price-low": "sortPriceLow",
  "price-high": "sortPriceHigh",
};

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

export function MarketplaceView({
  initialProducts,
  initialTotal,
  contact,
}: {
  initialProducts: MarketplaceProduct[];
  initialTotal: number;
  contact: MarketplaceContact;
}) {
  const t = useTranslations("Marketplace");
  const [selected, setSelected] = useState<MarketplaceProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MarketplaceSort>("newest");
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [hasMore, setHasMore] = useState(initialProducts.length < initialTotal);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestId.current += 1;
    };
  }, []);

  async function fetchPage(nextQuery: string, nextSort: MarketplaceSort, offset: number) {
    const id = requestId.current + 1;
    requestId.current = id;
    setLoading(true);
    setError(null);

    const result = await loadMarketplacePageAction({
      query: nextQuery,
      sort: nextSort,
      offset,
      limit: MARKETPLACE_PAGE_SIZE,
    }).catch(() => null);

    if (requestId.current !== id) return;

    if (!result || !result.ok) {
      setError(t("controls.loadError"));
      setLoading(false);
      return;
    }

    if (offset === 0) {
      setProducts(result.products);
    } else {
      setProducts((previous) => {
        const seen = new Set(previous.map((product) => product.id));
        return [...previous, ...result.products.filter((product) => !seen.has(product.id))];
      });
    }

    setTotal(result.total);
    setHasMore(offset + result.products.length < result.total);
    setLoading(false);
  }

  function schedule(nextQuery: string, nextSort: MarketplaceSort, delay = 300) {
    if (timerRef.current) clearTimeout(timerRef.current);
    requestId.current += 1;
    setLoading(true);
    setError(null);
    timerRef.current = setTimeout(() => {
      void fetchPage(nextQuery, nextSort, 0);
    }, delay);
  }

  function changeQuery(value: string) {
    setQuery(value);
    schedule(value, sort);
  }

  function changeSort(value: MarketplaceSort) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSort(value);
    schedule(query, value, 80);
  }

  function openProduct(product: MarketplaceProduct) {
    setSelected(product);
    setDialogOpen(true);
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
        <div className="flex flex-col items-stretch justify-between gap-space-md md:flex-row md:items-center">
          <div className="relative max-w-xl flex-1">
            <Icon
              name="search"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-xl text-text-muted"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder={t("controls.searchPlaceholder")}
              aria-label={t("controls.searchPlaceholder")}
              aria-busy={loading || undefined}
              className="h-12 w-full rounded-full border border-outline-variant bg-surface-low pr-4 pl-12 font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
          </div>

          <div className="flex items-center gap-space-sm md:justify-end">
            <label
              htmlFor="marketplace-sort"
              className="font-label-lg text-label-lg whitespace-nowrap text-secondary"
            >
              {t("controls.sortBy")}
            </label>
            <div className="relative min-w-0 flex-1 md:flex-none">
              <select
                id="marketplace-sort"
                value={sort}
                onChange={(event) => changeSort(event.target.value as MarketplaceSort)}
                className={cn(
                  "h-12 w-full cursor-pointer appearance-none rounded-full border border-outline-variant bg-surface-low pr-10 pl-4 font-label-lg text-label-lg text-on-surface transition-colors duration-300 hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:w-auto",
                  EASE,
                )}
              >
                {MARKETPLACE_SORTS.map((key) => (
                  <option key={key} value={key}>
                    {t(`controls.${SORT_LABEL[key]}`)}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-base text-secondary"
              />
            </div>
          </div>
        </div>

        <div className="mt-space-sm flex items-center justify-between gap-space-sm">
          <span aria-live="polite" className="font-body-sm text-body-sm text-text-muted">
            {loading
              ? t("controls.loading")
              : t("controls.showing", { shown: products.length, total })}
          </span>
          {loading ? <Spinner className="text-primary" label={t("controls.loading")} /> : null}
        </div>

        {error ? <InlineAlert className="mt-space-sm">{error}</InlineAlert> : null}
      </section>

      {/* Catalog */}
      <section className="mx-auto max-w-[1240px] px-margin-mobile pb-page-mobile md:px-margin md:pb-page">
        {products.length === 0 && !loading ? (
          <div className="bezel-tray">
            <div
              className="flex flex-col items-center gap-2 bezel-core py-space-xl text-center"
              style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
            >
              <Icon name="search_off" className="text-3xl text-secondary" />
              <p className="font-label-lg text-label-lg font-semibold text-on-surface">
                {t("controls.emptyTitle")}
              </p>
              <p className="max-w-[42ch] font-body-sm text-body-sm text-secondary">
                {t("controls.emptyBody")}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onOpen={() => openProduct(product)} />
            ))}
          </div>
        )}

        <div className="mt-space-lg flex flex-col items-center gap-space-xs">
          {hasMore ? (
            <button
              type="button"
              onClick={() => void fetchPage(query, sort, products.length)}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-space-lg font-label-lg text-label-lg font-semibold text-on-surface shadow-lift-sm transition-colors duration-300 hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:cursor-wait disabled:opacity-60"
            >
              {loading ? (
                <Spinner className="text-current" label={t("controls.loadingMore")} />
              ) : (
                <Icon name="expand_more" className="text-lg" />
              )}
              {loading ? t("controls.loadingMore") : t("controls.loadMore")}
            </button>
          ) : products.length > 0 ? (
            <p className="font-body-sm text-body-sm text-text-muted">{t("controls.allCaughtUp")}</p>
          ) : null}
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
            <button
              type="button"
              onClick={() => setInquiryOpen(true)}
              className={cn(
                "group inline-flex h-11 shrink-0 items-center gap-2 rounded-full border border-outline bg-surface-low px-5 font-label-lg text-label-lg whitespace-nowrap text-on-surface transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                EASE,
              )}
            >
              {t("notice.cta")}
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-surface/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <Icon name="north_east" className="text-[15px]" />
              </span>
            </button>
          </div>
        </div>
      </section>

      <ProductDialog
        product={selected}
        contact={contact}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
      <MarketplaceInquiryDialog
        contact={contact}
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
      />
    </>
  );
}

function ProductCard({ product, onOpen }: { product: MarketplaceProduct; onOpen: () => void }) {
  const t = useTranslations("Marketplace");

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${product.name} — ${t("card.viewDetails")}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-[1.25rem] border border-outline-variant bg-surface-low transition-colors duration-300 hover:border-outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <div className="relative block w-full overflow-hidden bg-surface-container">
        <span className="block aspect-[4/3] w-full">
          <MediaImage
            src={product.images[0] ?? null}
            alt={product.imageAlt}
            wrapperClassName="h-full w-full"
            className="transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-[1.03] motion-reduce:transform-none"
          />
        </span>

        {product.images.length > 1 ? (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/45 px-2.5 py-1 font-label-md text-label-md text-white backdrop-blur-sm">
            <Icon name="photo_library" className="text-sm" />
            {product.images.length}
          </span>
        ) : null}

        <span className="absolute top-3 right-3 rounded-full border border-outline-variant bg-surface-low/95 px-2.5 py-1 font-label-md text-label-md text-on-surface shadow-lift-sm">
          {product.originLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-space-sm p-space-md">
        <div className="flex flex-col gap-1">
          <h2 className="line-clamp-2 font-headline-sm text-headline-sm font-semibold text-balance text-on-surface transition-colors duration-300 group-hover:text-primary">
            {product.name}
          </h2>
          <p className="mt-0.5 line-clamp-2 font-body-sm text-body-sm text-pretty text-secondary">
            {product.description}
          </p>
        </div>

        <div className="mt-space-xs flex items-center justify-between gap-space-sm border-t border-outline-variant pt-space-sm">
          <div>
            <span className="block font-label-md text-label-md text-text-muted">
              {t("card.priceLabel")}
            </span>
            <span className="font-headline-sm text-headline-sm font-bold whitespace-nowrap text-on-surface tabular-nums">
              ${product.price} {t("drawer.currencyUsd")}
            </span>
          </div>
          <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-outline bg-surface-container pr-1.5 pl-4 font-label-lg text-label-lg font-semibold whitespace-nowrap text-on-surface">
            {t("card.viewDetails")}
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-on-surface/10">
              <Icon name="arrow_forward" className="text-[15px]" />
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
