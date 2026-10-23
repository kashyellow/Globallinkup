import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";

/**
 * S3c — the feed. Visible posts with their author, like count and the viewer's
 * own like state, plus whether the viewer is connected to the author. Images and
 * avatars are private storage paths resolved with two batched signed-URL calls.
 */

export type FeedPost = {
  id: string;
  authorId: string;
  author: string;
  location: string;
  avatar: string | null;
  image: string | null;
  caption: string;
  createdAt: string;
  likes: number;
  likedByViewer: boolean;
  connected: boolean;
  state: "none" | "requested" | "received" | "connected" | "declined";
  connectionId: string | undefined;
};

export async function getFeed(viewerId: string): Promise<FeedPost[]> {
  const supabase = await createClient();

  const posts = unwrap(
    await supabase
      .from("posts")
      .select("id, author_id, image_path, caption, created_at")
      .eq("moderation_status", "visible")
      .order("created_at", { ascending: false }),
  );

  if (!posts || posts.length === 0) return [];

  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const profiles = unwrap(
    await supabase
      .from("profiles_public")
      .select("id, display_name, city, country_code, avatar_url")
      .in("id", authorIds),
  );
  const authorById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const postIds = posts.map((post) => post.id);
  const likes = unwrap(
    await supabase.from("post_likes").select("post_id, user_id").in("post_id", postIds),
  );

  const likeCount = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
    if (like.user_id === viewerId) likedByViewer.add(like.post_id);
  }

  const connections = unwrap(
    await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
  );

  const connectedPeers = new Set<string>();
  const stateByPeer = new Map<string, { state: FeedPost["state"]; id: string }>();
  for (const connection of connections ?? []) {
    const peer =
      connection.requester_id === viewerId ? connection.recipient_id : connection.requester_id;
    if (connection.status === "accepted") connectedPeers.add(peer);
    const state: FeedPost["state"] =
      connection.status === "accepted"
        ? "connected"
        : connection.status === "declined"
          ? "declined"
          : connection.recipient_id === viewerId
            ? "received"
            : "requested";
    stateByPeer.set(peer, { state, id: connection.id });
  }

  // Authors hidden by `profiles_public` (suspended/rejected) are dropped before
  // signing anything, so we never request URLs we cannot render.
  const visiblePosts = posts.filter((post) => authorById.has(post.author_id));

  const [postImages, avatars] = await Promise.all([
    createSignedImageUrls(
      supabase,
      "post-images",
      visiblePosts.map((post) => post.image_path),
    ),
    createSignedImageUrls(
      supabase,
      "avatars",
      visiblePosts.map((post) => authorById.get(post.author_id)?.avatar_url),
    ),
  ]);

  return visiblePosts.map((post) => {
    const author = authorById.get(post.author_id);
    const connection = stateByPeer.get(post.author_id);

    return {
      id: post.id,
      authorId: post.author_id,
      author: author?.display_name ?? "",
      location: [author?.city, author?.country_code].filter(Boolean).join(", "),
      avatar: resolveImageUrl(author?.avatar_url, avatars),
      image: resolveImageUrl(post.image_path, postImages),
      caption: post.caption ?? "",
      createdAt: post.created_at ?? "",
      likes: likeCount.get(post.id) ?? 0,
      likedByViewer: likedByViewer.has(post.id),
      connected: connectedPeers.has(post.author_id),
      state: connection?.state ?? "none",
      connectionId: connection?.id,
    } satisfies FeedPost;
  });
}
