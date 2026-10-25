"use server";

import { z } from "zod";

import { getCurrentProfile, getCurrentUser } from "@/lib/auth";

import { POST_FILTERS, POSTS_PAGE_SIZE } from "./data";
import { getFeedPage, type FeedPost } from "./queries";

const feedQuerySchema = z.object({
  filter: z.enum(POST_FILTERS).default("all"),
  offset: z.number().int().min(0).max(10_000).default(0),
  limit: z.number().int().min(1).max(20).default(POSTS_PAGE_SIZE),
});

export type FeedActionError = "forbidden" | "invalid" | "unknown";

export type FeedActionResult =
  { ok: true; posts: FeedPost[]; total: number } | { ok: false; error: FeedActionError };

/** Load one feed page. The viewer is always derived from the session. */
export async function loadFeedPageAction(input: unknown): Promise<FeedActionResult> {
  const parsed = feedQuerySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "forbidden" };

  const profile = await getCurrentProfile();
  if (!profile || profile.approval_status !== "approved") {
    return { ok: false, error: "forbidden" };
  }

  try {
    const result = await getFeedPage({
      viewerId: user.id,
      filter: parsed.data.filter,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });

    return { ok: true, ...result };
  } catch {
    return { ok: false, error: "unknown" };
  }
}
