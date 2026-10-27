import "server-only";

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
export async function getNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const rows = unwrap(
    await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit),
  );
  return rows ?? [];
}

export async function markAllNotificationsRead(): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
}
