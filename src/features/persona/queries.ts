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
    .select("id, requester_id, recipient_id, status")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`);

  const stateByPeer = new Map<string, { state: ConnectState; id: string }>();
  for (const connection of connections ?? []) {
    const peer =
      connection.requester_id === viewerId ? connection.recipient_id : connection.requester_id;
    const state: ConnectState =
      connection.status === "accepted"
        ? "connected"
        : connection.status === "declined"
          ? "declined"
          : connection.recipient_id === viewerId
            ? "received"
            : "requested";
    stateByPeer.set(peer, { state, id: connection.id });
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
        connectState: stateByPeer.get(row.id ?? "")?.state ?? "none",
        connectionId: stateByPeer.get(row.id ?? "")?.id,
        imageUrl,
      });
    }),
  );
}

/** FR-4.3 — one approved persona plus the viewer's connection state. */
export type PersonaDetail = Persona & { bio: string };

export async function getPersonaDetail(
  viewerId: string,
  personaId: string,
): Promise<PersonaDetail | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("profiles_public")
    .select("*")
    .eq("id", personaId)
    .eq("approval_status", "approved")
    .maybeSingle();

  if (!row) return null;

  const { data: connection } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status")
    .or(
      `and(requester_id.eq.${viewerId},recipient_id.eq.${personaId}),and(requester_id.eq.${personaId},recipient_id.eq.${viewerId})`,
    )
    .maybeSingle();

  const state: ConnectState = !connection
    ? "none"
    : connection.status === "accepted"
      ? "connected"
      : connection.status === "declined"
        ? "declined"
        : connection.recipient_id === viewerId
          ? "received"
          : "requested";

  const avatarPath = row.avatar_url;
  const imageUrl = !avatarPath
    ? null
    : avatarPath.startsWith("http")
      ? avatarPath
      : await createSignedImageUrl(supabase, "avatars", avatarPath);

  return {
    ...mapPersonaRow(row, {
      connectState: state,
      connectionId: connection?.id,
      imageUrl,
    }),
    bio: row.bio_en ?? row.bio_es ?? "",
  };
}
