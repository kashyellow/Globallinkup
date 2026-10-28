import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PurgeResult = {
  dry_run?: boolean;
  posts?: number;
  comments?: number;
  notifications?: number;
  paths?: unknown;
};

/**
 * Daily purge (ADR 0001). Vercel Cron calls this at 03:00 UTC with
 * `Authorization: Bearer $CRON_SECRET`. The database function deletes rows and
 * returns the storage paths; object deletion happens here because SQL cannot
 * reach the Storage API.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new NextResponse("unauthorized", { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("purge_expired_content", { p_dry_run: false });

  if (error) {
    console.error("[purge] database step failed", { code: error.code });
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const audit = await supabase.rpc("purge_audit_events");
  const result = (data ?? {}) as PurgeResult;
  const paths = Array.isArray(result.paths)
    ? result.paths.filter((path): path is string => typeof path === "string" && path.length > 0)
    : [];

  let images = 0;
  if (paths.length > 0) {
    const removed = await supabase.storage.from("post-images").remove(paths);
    if (removed.error) {
      // The rows are already gone, so the files are unreadable; the next run's
      // orphan sweep is a follow-up, not a blocker.
      console.error("[purge] storage cleanup failed", { count: paths.length });
    } else {
      images = paths.length;
    }
  }

  return NextResponse.json({
    ok: true,
    posts: result.posts ?? 0,
    comments: result.comments ?? 0,
    notifications: result.notifications ?? 0,
    audit: audit.data ?? 0,
    images,
  });
}
