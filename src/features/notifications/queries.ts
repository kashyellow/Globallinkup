import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const result = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return result.count ?? 0;
}

/** Newest first. Read state is captured before the page marks them read. */
export async function getNotifications(
  supabase: SupabaseClient<Database>,
  limit = 50,
): Promise<NotificationRow[]> {
  const rows = unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
  return rows ?? [];
}

/**
 * Takes the client instead of creating one: the caller may run this from
 * `after()`, where Next forbids `cookies()` because the response is already
 * being flushed.
 */
export async function markAllNotificationsRead(supabase: SupabaseClient<Database>): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}
