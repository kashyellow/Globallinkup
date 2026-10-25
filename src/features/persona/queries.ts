import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

import type { ConnectState, Persona } from "./data";
import { mapPersonaRow } from "./mappers";

/**
 * S3a — discovery reads. Approved profiles (via `profiles_public`, which keeps
 * `profiles` RLS in charge) plus the viewer's connect state per peer. Avatars
 * come from private storage as short-lived signed URLs, signed in one batch.
 */

const LIST_COLUMNS =
  "id, display_name, country_code, city, avatar_url, languages, interests, badge, approval_status, age";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export type DiscoverQuery = {
  viewerId: string;
  query: string;
  countries: string[];
  limit: number;
  offset: number;
};

export type DiscoverResult = {
  personas: Persona[];
  total: number;
};

/** S6 — approved suggestions plus the viewer's own pending labels (RLS-gated). */
export type InterestCatalogItem = {
  label: string;
  status: "approved" | "pending";
};

export async function getInterestCatalog(): Promise<InterestCatalogItem[]> {
  // Step 2 is reachable before sign-up, and builds without Supabase env must not
  // fail the page; the seeded eight still render when the catalog is absent.
  const supabase = await createClient().catch(() => null);
  if (!supabase) return [];

  const rows = unwrap(
    await supabase
      .from("interest_catalog")
      .select("label, status")
      .in("status", ["approved", "pending"])
      .order("label", { ascending: true }),
  );

  return (rows ?? []).map((row) => ({
    label: row.label,
    status: row.status === "pending" ? "pending" : "approved",
  }));
}

export async function getDiscoverPersonas({
  viewerId,
  query,
  countries,
  limit,
  offset,
}: DiscoverQuery): Promise<DiscoverResult> {
  const supabase = await createClient();

  let request = supabase
    .from("profiles_public")
    .select(LIST_COLUMNS, { count: "exact" })
    .eq("approval_status", "approved")
    .eq("role", "user")
    .neq("id", viewerId);

  if (countries.length > 0) {
    request = request.in("country_code", countries);
  }

  const needle = query.trim();
  if (needle.length > 0) {
    request = request.ilike("search_text", `%${escapeLike(needle)}%`);
  }

  const response = await request
    .order("display_name", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  const rows = unwrap(response) ?? [];
  const total = response.count ?? rows.length;

  if (rows.length === 0) {
    return { personas: [], total };
  }

  const connections = unwrap(
    await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
  );

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

  const signed = await createSignedImageUrls(
    supabase,
    "avatars",
    rows.map((row) => row.avatar_url),
  );

  return {
    personas: rows.map((row) =>
      mapPersonaRow(row, {
        connectState: stateByPeer.get(row.id ?? "")?.state ?? "none",
        connectionId: stateByPeer.get(row.id ?? "")?.id,
        imageUrl: resolveImageUrl(row.avatar_url, signed),
      }),
    ),
    total,
  };
}

/** FR-4.3 — one approved persona plus the viewer's connection state. */
export type PersonaDetail = Persona & { bio: string };

export async function getPersonaDetail(
  viewerId: string,
  personaId: string,
): Promise<PersonaDetail | null> {
  const supabase = await createClient();

  const row = unwrap<Database["public"]["Views"]["profiles_public"]["Row"]>(
    await supabase
      .from("profiles_public")
      .select(
        "id, display_name, country_code, city, avatar_url, languages, interests, badge, approval_status, age, bio_en, bio_es",
      )
      .eq("id", personaId)
      .eq("approval_status", "approved")
      .maybeSingle(),
  );

  if (!row) return null;

  const connection = unwrap<{
    id: string;
    requester_id: string;
    recipient_id: string;
    status: "requested" | "accepted" | "declined";
  }>(
    await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(
        `and(requester_id.eq.${viewerId},recipient_id.eq.${personaId}),and(requester_id.eq.${personaId},recipient_id.eq.${viewerId})`,
      )
      .maybeSingle(),
  );

  const state: ConnectState = !connection
    ? "none"
    : connection.status === "accepted"
      ? "connected"
      : connection.status === "declined"
        ? "declined"
        : connection.recipient_id === viewerId
          ? "received"
          : "requested";

  const signed = await createSignedImageUrls(supabase, "avatars", [row.avatar_url]);

  return {
    ...mapPersonaRow(row, {
      connectState: state,
      connectionId: connection?.id,
      imageUrl: resolveImageUrl(row.avatar_url, signed),
    }),
    bio: row.bio_en ?? row.bio_es ?? "",
  };
}
