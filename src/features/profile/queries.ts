import "server-only";

import { createSignedImageUrl, createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

/** S3a (own profile) — identity, unlocked channels, archive and unveiled peers. */

export type ProfileChannel = { key: string; value: string };
export type UnveiledPeer = { id: string; name: string; city: string; unlockedAt: string };
export type ProfileDispatch = {
  id: string;
  image: string | null;
  caption: string;
  createdAt: string;
  likes: number;
};

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
  /** The member's own visible posts, newest first. */
  dispatches: ProfileDispatch[];
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
      .select("id, image_path, caption, created_at")
      .eq("author_id", viewerId)
      .eq("moderation_status", "visible")
      .order("created_at", { ascending: false }),
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

  // The archive is the member's own visible posts. Like counts are read for
  // those posts only, and images are signed in one batch.
  const posts = unwrap(postsRes) ?? [];
  const postIds = posts.map((post) => post.id);
  const likes =
    postIds.length > 0
      ? unwrap(await supabase.from("post_likes").select("post_id").in("post_id", postIds))
      : [];

  const likeCount = new Map<string, number>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
  }

  const postImages = await createSignedImageUrls(
    supabase,
    "post-images",
    posts.map((post) => post.image_path),
  );

  const dispatches: ProfileDispatch[] = posts.map((post) => ({
    id: post.id,
    image: resolveImageUrl(post.image_path, postImages),
    caption: post.caption ?? "",
    createdAt: post.created_at ?? "",
    likes: likeCount.get(post.id) ?? 0,
  }));

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
    metrics: { connections: connections.length, dispatches: dispatches.length },
    unveiled,
    dispatches,
  };
}
