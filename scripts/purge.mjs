#!/usr/bin/env node
/**
 * Run the daily purge from a terminal (local, staging, or a manual production
 * run). Same code path as the Vercel Cron route: the database function deletes
 * rows and hands back the storage paths, then this deletes the objects.
 *
 * Usage:
 *   npm run purge -- --dry-run
 *   npm run purge
 *
 * Reads NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the
 * environment (loaded from .env by the npm script).
 */
import { parseArgs } from "node:util";

import { createClient } from "@supabase/supabase-js";

function fail(message) {
  console.error(`\nError: ${message}\n`);
  process.exit(2);
}

const { values } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

if (values.help) {
  console.log("Usage: npm run purge -- [--dry-run]");
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url) fail("NEXT_PUBLIC_SUPABASE_URL is not set.");
if (!serviceKey) fail("SUPABASE_SERVICE_ROLE_KEY is not set.");

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const dryRun = values["dry-run"];

const { data, error } = await supabase.rpc("purge_expired_content", { p_dry_run: dryRun });

if (error) fail(`purge failed: ${error.message}`);

const paths = Array.isArray(data?.paths) ? data.paths.filter(Boolean) : [];

if (dryRun) {
  console.log("Purge (dry run)");
  console.log(`  posts         : ${data?.posts ?? 0}`);
  console.log(`  comments      : ${data?.comments ?? 0}`);
  console.log(`  notifications : ${data?.notifications ?? 0}`);
  console.log(`  images        : ${paths.length}`);
  console.log("  nothing was written.");
  process.exit(0);
}

let images = 0;
if (paths.length > 0) {
  const { error: storageError } = await supabase.storage.from("post-images").remove(paths);
  if (storageError) {
    console.error(`Storage cleanup failed (${paths.length} files): ${storageError.message}`);
  } else {
    images = paths.length;
  }
}

console.log("Purge complete");
console.log(`  posts         : ${data?.posts ?? 0}`);
console.log(`  comments      : ${data?.comments ?? 0}`);
console.log(`  notifications : ${data?.notifications ?? 0}`);
console.log(`  images        : ${images}`);
