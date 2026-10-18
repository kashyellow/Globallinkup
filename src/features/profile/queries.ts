import "server-only";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/** S3a (own profile) — identity, unlocked channels, counts and unveiled peers. */

export type ProfileChannel = { key: string; value: string };
export type UnveiledPeer = { id: string; name: string; city: string; unlockedAt: string };

export type OwnProfile = {
  id: string;
  name: string;
  age: number;
  headline: string;
  location: string;
  languages: string;
  avatar: string | null;
  bio: string;
  interests: string[];
  channels: ProfileChannel[];
  metrics: { connections: number; dispatches: number };
  unveiled: UnveiledPeer[];
};

export async function getOwnProfile(viewerId: string): Promise<OwnProfile | null> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, display_name, city, country_code, headline, avatar_url, bio_en, bio_es, languages, interests",
    )
    .eq("id", viewerId)
    .maybeSingle();

  if (!profile) return null;

  const [privateRes, contactRes, connectionsRes, postsRes] = await Promise.all([
    supabase
      .from("profile_private")
      .select("date_of_birth")
      .eq("profile_id", viewerId)
      .maybeSingle(),
    supabase
      .from("contact_details")
      .select("whatsapp, instagram, other")
      .eq("profile_id", viewerId)
      .maybeSingle(),
    supabase
      .from("connections")
      .select("id, requester_id, recipient_id, updated_at, status")
      .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`)
      .eq("status", "accepted"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", viewerId)
      .eq("moderation_status", "visible"),
  ]);

  const avatarPath = profile.avatar_url;
  const avatar = !avatarPath
    ? null
    : avatarPath.startsWith("http")
      ? avatarPath
      : await createSignedImageUrl(supabase, "avatars", avatarPath);

  const dateOfBirth = privateRes.data?.date_of_birth ?? null;
  const age = dateOfBirth
    ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  const contact = contactRes.data;
  const other = (contact?.other ?? {}) as Record<string, unknown>;
  const channels: ProfileChannel[] = [];
  const push = (key: string, value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      channels.push({ key, value: value.trim() });
    }
  };
  push("whatsapp", contact?.whatsapp);
  push("telegram", other.telegram);
  push("instagram", contact?.instagram);
  push("facebook", other.facebook);
  push("tiktok", other.tiktok);
  push("x", other.x);

  const connections = connectionsRes.data ?? [];
  const peerIds = connections.map((row) =>
    row.requester_id === viewerId ? row.recipient_id : row.requester_id,
  );
  const peersRes =
    peerIds.length > 0
      ? await supabase.from("profiles_public").select("id, display_name, city").in("id", peerIds)
      : { data: [] as { id: string; display_name: string | null; city: string | null }[] };
  const peerById = new Map((peersRes.data ?? []).map((peer) => [peer.id, peer]));

  const unveiled: UnveiledPeer[] = connections.map((row) => {
    const peerId = row.requester_id === viewerId ? row.recipient_id : row.requester_id;
    const peer = peerById.get(peerId);
    return {
      id: peerId,
      name: peer?.display_name ?? "",
      city: peer?.city ?? "",
      unlockedAt: row.updated_at ?? "",
    };
  });

  const languages = Array.isArray(profile.languages)
    ? (profile.languages as { code?: string }[])
        .map((entry) => entry?.code ?? "")
        .filter(Boolean)
        .join(" • ")
    : "";

  return {
    id: profile.id,
    name: profile.display_name ?? "",
    age,
    headline: profile.headline ?? "",
    location: [profile.city, profile.country_code].filter(Boolean).join(", "),
    languages,
    avatar,
    bio: profile.bio_en ?? profile.bio_es ?? "",
    interests: profile.interests ?? [],
    channels,
    metrics: { connections: connections.length, dispatches: postsRes.count ?? 0 },
    unveiled,
  };
}
