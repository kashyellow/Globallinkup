"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";
import { PLATFORM_COUNTRIES } from "@/lib/persona/countries";

import { DISCOVER_PAGE_SIZE } from "./constants";
import { getDiscoverPersonas } from "./queries";
import type { Persona } from "./data";

const discoverQuerySchema = z.object({
  query: z.string().trim().max(100).default(""),
  countries: z.array(z.enum(PLATFORM_COUNTRIES)).max(PLATFORM_COUNTRIES.length).default([]),
  offset: z.number().int().min(0).max(10_000).default(0),
  limit: z.number().int().min(1).max(20).default(DISCOVER_PAGE_SIZE),
  seed: z.string().trim().min(1).max(64).default("default"),
});

export type DiscoverActionError = "forbidden" | "invalid" | "unknown";

export type DiscoverActionResult =
  { ok: true; personas: Persona[]; total: number } | { ok: false; error: DiscoverActionError };

/**
 * Fetch one discover page with server-side search/region filtering. The viewer
 * is always derived from the session; the client never supplies a profile id.
 */
export async function loadDiscoverPersonasAction(input: unknown): Promise<DiscoverActionResult> {
  const parsed = discoverQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };

  const profile = await getCurrentProfile();
  if (!profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  try {
    const result = await getDiscoverPersonas({
      viewerId: user.id,
      query: parsed.data.query,
      countries: [...new Set(parsed.data.countries)],
      limit: parsed.data.limit,
      offset: parsed.data.offset,
      seed: parsed.data.seed,
    });

    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
