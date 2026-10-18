import "server-only";

import { createSignedImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";

/**
 * S3c — the feed. Visible posts with their author, like count and the viewer's
 * own like state, plus whether the viewer is connected to the author. Images and
 * avatars are private storage paths resolved to signed URLs.
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
};

export async function getFeed(viewerId: string): Promise<FeedPost[]> {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, author_id, image_path, caption, created_at")
    .eq("moderation_status", "visible")
    .order("created_at", { ascending: false });

  if (!posts || posts.length === 0) return [];

  const authorIds = [...new Set(posts.map((post) => post.author_id))];
  const { data: profiles } = await supabase.from("profiles_public").select("*").in("id", authorIds);
  const authorById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  const postIds = posts.map((post) => post.id);
  const { data: likes } = await supabase
    .from("post_likes")
    .select("post_id, user_id")
    .in("post_id", postIds);

  const likeCount = new Map<string, number>();
  const likedByViewer = new Set<string>();
  for (const like of likes ?? []) {
    likeCount.set(like.post_id, (likeCount.get(like.post_id) ?? 0) + 1);
    if (like.user_id === viewerId) likedByViewer.add(like.post_id);
  }

  const { data: connections } = await supabase
    .from("connections")
    .select("requester_id, recipient_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`);

  const connectedPeers = new Set<string>();
  for (const connection of connections ?? []) {
    connectedPeers.add(
      connection.requester_id === viewerId ? connection.recipient_id : connection.requester_id,
    );
  }

  return Promise.all(
    posts.map(async (post) => {
      const author = authorById.get(post.author_id);
      const image = post.image_path
        ? await createSignedImageUrl(supabase, "post-images", post.image_path)
        : null;
      const avatarPath = author?.avatar_url ?? null;
      const avatar = !avatarPath
        ? null
        : avatarPath.startsWith("http")
          ? avatarPath
          : await createSignedImageUrl(supabase, "avatars", avatarPath);

      return {
        id: post.id,
        authorId: post.author_id,
        author: author?.display_name ?? "",
        location: [author?.city, author?.country_code].filter(Boolean).join(", "),
        avatar,
        image,
        caption: post.caption ?? "",
        createdAt: post.created_at ?? "",
        likes: likeCount.get(post.id) ?? 0,
        likedByViewer: likedByViewer.has(post.id),
        connected: connectedPeers.has(post.author_id),
      };
    }),
  );
}
