import "server-only";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

import type { ConnectState, Persona } from "./data";
import { mapPersonaRow } from "./mappers";

/**
 * S3a — discovery reads. Approved profiles (via `profiles_public`, which keeps
 * `profiles` RLS in charge) plus the viewer's connect state per peer. Avatars
 * come from private storage as short-lived signed URLs.
 */
export async function getDiscoverPersonas(viewerId: string): Promise<Persona[]> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("profiles_public")
    .select("*")
    .eq("approval_status", "approved")
    .eq("role", "user")
    .neq("id", viewerId)
    .order("display_name", { ascending: true });

  if (!rows || rows.length === 0) return [];

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, recipient_id, status")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`);

  const stateByPeer = new Map<string, ConnectState>();
  for (const connection of connections ?? []) {
    const peer =
      connection.requester_id === viewerId ? connection.recipient_id : connection.requester_id;
    if (connection.status === "accepted") stateByPeer.set(peer, "connected");
    else if (connection.status === "requested") stateByPeer.set(peer, "requested");
  }

  return Promise.all(
    rows.map(async (row) => {
      const avatarPath = row.avatar_url;
      const imageUrl = !avatarPath
        ? null
        : avatarPath.startsWith("http")
          ? avatarPath
          : await createSignedImageUrl(supabase, "avatars", avatarPath);

      return mapPersonaRow(row, {
        connectState: stateByPeer.get(row.id ?? "") ?? "none",
        imageUrl,
      });
    }),
  );
}
