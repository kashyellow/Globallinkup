"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

import { MARKETPLACE_PAGE_SIZE, MARKETPLACE_SORTS, type MarketplaceSort } from "./constants";
import { getMarketplacePage, type MarketplaceProduct } from "./queries";

const querySchema = z.object({
  query: z.string().trim().max(100).default(""),
  sort: z.enum(MARKETPLACE_SORTS).default("featured"),
  offset: z.number().int().min(0).max(10_000).default(0),
  limit: z.number().int().min(1).max(24).default(MARKETPLACE_PAGE_SIZE),
});

export type MarketplaceActionError = "forbidden" | "invalid" | "unknown";

export type MarketplaceActionResult =
  | { ok: true; products: MarketplaceProduct[]; total: number }
  | { ok: false; error: MarketplaceActionError };

export async function loadMarketplacePageAction(input: unknown): Promise<MarketplaceActionResult> {
  const parsed = querySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const user = await getCurrentUser();
  const profile = await getCurrentProfile();
  if (!user || !profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  try {
    const result = await getMarketplacePage({
      query: parsed.data.query,
      sort: parsed.data.sort as MarketplaceSort,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
