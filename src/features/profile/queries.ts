import "server-only";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap, unwrapCount } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

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

function ageFromDateOfBirth(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 0;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const month = today.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) age -= 1;
  return Math.max(age, 0);
}

export async function getOwnProfile(viewerId: string): Promise<OwnProfile | null> {
  const supabase = await createClient();

  const profile = unwrap<Database["public"]["Tables"]["profiles"]["Row"]>(
    await supabase
      .from("profiles")
      .select(
        "id, display_name, city, country_code, headline, avatar_url, bio_en, bio_es, languages, interests",
      )
      .eq("id", viewerId)
      .maybeSingle(),
  );

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

  const dateOfBirth = unwrap<{ date_of_birth: string | null }>(privateRes)?.date_of_birth ?? null;
  const age = ageFromDateOfBirth(dateOfBirth);

  const contact = unwrap<{
    whatsapp: string | null;
    instagram: string | null;
    other: unknown;
  }>(contactRes);
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

  const connections = unwrap(connectionsRes) ?? [];
  const peerIds = connections.map((row) =>
    row.requester_id === viewerId ? row.recipient_id : row.requester_id,
  );
  const peers =
    peerIds.length > 0
      ? unwrap(
          await supabase.from("profiles_public").select("id, display_name, city").in("id", peerIds),
        )
      : [];
  const peerById = new Map((peers ?? []).map((peer) => [peer.id, peer]));

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
    metrics: { connections: connections.length, dispatches: unwrapCount(postsRes) },
    unveiled,
  };
}
