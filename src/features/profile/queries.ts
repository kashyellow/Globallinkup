import "server-only";

import { createSignedImageUrl, createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

/** S3a (own profile) — identity, unlocked channels, archive and unveiled peers. */

export type ProfileChannel = { key: string; value: string };
export type UnveiledPeer = {
  id: string;
  name: string;
  city: string;
  avatar: string | null;
  unlockedAt: string;
};
export type ProfileDispatch = {
  id: string;
  image: string | null;
  caption: string;
  createdAt: string;
  likes: number;
  state: "visible" | "archived" | "removed";
  removedReason: string | null;
  purgeAfter: string | null;
  appeal: {
    status: "open" | "accepted" | "declined";
    message: string;
    adminNote: string | null;
  } | null;
};

export type OwnProfile = {
  id: string;
  name: string;
  role: "user" | "admin";
  age: number;
  headline: string;
  location: string;
  languages: string;
  avatar: string | null;
  bio: string;
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

export async function getOwnProfile(
  viewerId: string,
  locale: string = "en",
): Promise<OwnProfile | null> {
  const supabase = await createClient();

  const profile = unwrap<Database["public"]["Tables"]["profiles"]["Row"]>(
    await supabase
      .from("profiles")
      .select(
        "id, display_name, city, country_code, headline, avatar_url, bio_en, bio_es, languages",
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
      .select("id, image_path, caption, created_at, state, removed_reason, purge_after")
      .eq("author_id", viewerId)
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
          await supabase
            .from("profiles_public")
            .select("id, display_name, city, avatar_url")
            .in("id", peerIds),
        )
      : [];
  const peerById = new Map((peers ?? []).map((peer) => [peer.id, peer]));
  const peerAvatars = await createSignedImageUrls(
    supabase,
    "avatars",
    (peers ?? []).map((peer) => peer.avatar_url),
  );

  const unveiled: UnveiledPeer[] = connections.map((row) => {
    const peerId = row.requester_id === viewerId ? row.recipient_id : row.requester_id;
    const peer = peerById.get(peerId);
    return {
      id: peerId,
      name: peer?.display_name ?? "",
      city: peer?.city ?? "",
      avatar: resolveImageUrl(peer?.avatar_url, peerAvatars),
      unlockedAt: row.updated_at ?? "",
    };
  });

  // The archive is every post the member owns, whatever its lifecycle state;
  // the UI splits them into Active / Archived / Removed.
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

  const removedIds = posts.filter((post) => post.state === "removed").map((post) => post.id);
  const appealByPost = new Map<string, NonNullable<ProfileDispatch["appeal"]>>();
  if (removedIds.length > 0) {
    const appeals = unwrap(
      await supabase
        .from("post_appeals")
        .select("post_id, message, status, admin_note, created_at")
        .in("post_id", removedIds)
        .order("created_at", { ascending: false }),
    );
    for (const row of appeals ?? []) {
      if (!appealByPost.has(row.post_id)) {
        appealByPost.set(row.post_id, {
          status: row.status,
          message: row.message,
          adminNote: row.admin_note,
        });
      }
    }
  }

  const dispatches: ProfileDispatch[] = posts.map((post) => ({
    id: post.id,
    image: resolveImageUrl(post.image_path, postImages),
    caption: post.caption ?? "",
    createdAt: post.created_at ?? "",
    likes: likeCount.get(post.id) ?? 0,
    state: post.state,
    removedReason: post.removed_reason,
    purgeAfter: post.purge_after,
    appeal: appealByPost.get(post.id) ?? null,
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
    role: profile.role,
    age,
    headline: profile.headline ?? "",
    location: [profile.city, profile.country_code].filter(Boolean).join(", "),
    languages,
    avatar,
    bio:
      locale === "es"
        ? (profile.bio_es ?? profile.bio_en ?? "")
        : (profile.bio_en ?? profile.bio_es ?? ""),
    channels,
    metrics: { connections: connections.length, dispatches: dispatches.length },
    unveiled,
    dispatches,
  };
}
