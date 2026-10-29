/** Public catalog grid: 3 × 3 on desktop. */
export const MARKETPLACE_PAGE_SIZE = 9;

export const MARKETPLACE_SORTS = ["newest", "price-low", "price-high"] as const;
export type MarketplaceSort = (typeof MARKETPLACE_SORTS)[number];
