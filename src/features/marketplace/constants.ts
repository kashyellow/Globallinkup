/** Public catalog grid: 3 × 3 on desktop. */
export const MARKETPLACE_PAGE_SIZE = 9;

export const MARKETPLACE_SORTS = ["featured", "price-low", "price-high", "newest"] as const;
export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];
