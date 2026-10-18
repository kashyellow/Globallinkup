import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * S3b — the connections page reads. Accepted connections come with their
 * unlocked contact channels (RLS returns `contact_details` only for those),
 * inbound requests carry the note, and outbound requests show what was sent.
 */

type Language = { code: string; level: string };
type ChannelKey = "whatsapp" | "telegram" | "instagram" | "facebook" | "tiktok" | "x";
export type ContactChannel = { key: ChannelKey; value: string };

export type ActiveConnectionDto = {
  id: string;
  name: string;
  age: number;
  location: string;
  countryCode: string;
  neighborhood: string;
  avatar: string | null;
  languages: Language[];
  badge: string | null;
  connectedSince: string;
  interests: string[];
  channels: ContactChannel[];
};

export type ReceivedRequestDto = {
  id: string;
  name: string;
  age: number;
  location: string;
  neighborhood: string;
  avatar: string | null;
  languages: Language[];
  createdAt: string;
  intro: string;
};

export type SentRequestDto = {
  id: string;
  name: string;
  age: number;
  location: string;
  avatar: string | null;
  createdAt: string;
  intro: string;
};

export type ConnectionsData = {
  active: ActiveConnectionDto[];
  received: ReceivedRequestDto[];
  sent: SentRequestDto[];
};

const LEVELS = new Set(["native", "fluent", "advanced", "conversational", "proficient", "basic"]);

function parseLanguages(value: unknown): Language[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const code = (entry as { code?: unknown }).code;
    const level = (entry as { level?: unknown }).level;
    if (typeof code !== "string" || code.length === 0) return [];
    return [{ code, level: typeof level === "string" && LEVELS.has(level) ? level : "fluent" }];
  });
}

function buildChannels(
  contact: { whatsapp: string | null; instagram: string | null; other: unknown } | undefined,
): ContactChannel[] {
  if (!contact) return [];
  const other = (contact.other ?? {}) as Record<string, unknown>;
  const channels: ContactChannel[] = [];

  const push = (key: ChannelKey, value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      channels.push({ key, value: value.trim() });
    }
  };

  push("whatsapp", contact.whatsapp);
  push("telegram", other.telegram);
  push("instagram", contact.instagram);
  push("facebook", other.facebook);
  push("tiktok", other.tiktok);
  push("x", other.x);

  return channels;
}

async function resolveAvatar(
  supabase: SupabaseClient<Database>,
  avatarUrl: string | null,
): Promise<string | null> {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith("http")) return avatarUrl;
  return createSignedImageUrl(supabase, "avatars", avatarUrl);
}

export async function getConnectionsData(viewerId: string): Promise<ConnectionsData> {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("connections")
    .select("id, requester_id, recipient_id, status, intro, created_at, updated_at")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`)
    .order("created_at", { ascending: false });

  if (!rows || rows.length === 0) return { active: [], received: [], sent: [] };

  const peerIdFor = (row: (typeof rows)[number]) =>
    row.requester_id === viewerId ? row.recipient_id : row.requester_id;

  const peerIds = [...new Set(rows.map(peerIdFor))];
  const { data: profiles } = await supabase.from("profiles_public").select("*").in("id", peerIds);
  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const acceptedPeerIds = rows.filter((row) => row.status === "accepted").map(peerIdFor);
  const contactById = new Map<
    string,
    { whatsapp: string | null; instagram: string | null; other: unknown }
  >();
  if (acceptedPeerIds.length > 0) {
    const { data: contacts } = await supabase
      .from("contact_details")
      .select("profile_id, whatsapp, instagram, other")
      .in("profile_id", acceptedPeerIds);
    for (const contact of contacts ?? []) contactById.set(contact.profile_id, contact);
  }

  const active: ActiveConnectionDto[] = [];
  const received: ReceivedRequestDto[] = [];
  const sent: SentRequestDto[] = [];

  for (const row of rows) {
    const peerId = peerIdFor(row);
    const profile = profileById.get(peerId);
    if (!profile) continue;

    const avatar = await resolveAvatar(supabase, profile.avatar_url);
    const shared = {
      name: profile.display_name ?? "",
      age: profile.age ?? 0,
      location: [profile.city, profile.country_code].filter(Boolean).join(", "),
      neighborhood: profile.neighborhood ?? "",
      avatar,
      languages: parseLanguages(profile.languages),
    };

    if (row.status === "accepted") {
      active.push({
        id: row.id,
        ...shared,
        countryCode: profile.country_code ?? "",
        badge: profile.badge ?? null,
        connectedSince: row.updated_at ?? row.created_at ?? "",
        interests: profile.interests ?? [],
        channels: buildChannels(contactById.get(peerId)),
      });
    } else if (row.status === "requested" && row.recipient_id === viewerId) {
      received.push({
        id: row.id,
        ...shared,
        createdAt: row.created_at ?? "",
        intro: row.intro ?? "",
      });
    } else if (row.status === "requested" && row.requester_id === viewerId) {
      sent.push({
        id: row.id,
        name: shared.name,
        age: shared.age,
        location: shared.location,
        avatar: shared.avatar,
        createdAt: row.created_at ?? "",
        intro: row.intro ?? "",
      });
    }
  }

  return { active, received, sent };
}
