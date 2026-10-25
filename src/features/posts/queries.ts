import "server-only";

import { createSignedImageUrls, resolveImageUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { unwrap } from "@/lib/supabase/unwrap";
import type { Database } from "@/types/database";

import { SPAIN_LATAM_COUNTRIES, type PostFilter } from "./data";

/**
 * View columns are nullable in generated types even when the underlying row is
 * not. Keep one concrete shape here and normalise at the query boundary.
 */
type FeedRow = {
  id: string;
  author_id: string;
  image_path: string | null;
  caption: string | null;
  moderation_status: Database["public"]["Enums"]["moderation_status"] | null;
  created_at: string | null;
  author_name: string | null;
  author_country_code: string | null;
  author_city: string | null;
  author_avatar_url: string | null;
  comment_count: number | null;
  like_count: number | null;
};
type Supabase = Awaited<ReturnType<typeof createClient>>;
type ConnectionState = "none" | "requested" | "received" | "connected" | "declined";

export type FeedComment = {
  id: string;
  postId: string;
  authorId: string;
  author: string;
  avatar: string | null;
  body: string;
  parentId: string | null;
  createdAt: string;
  deletedAt: string | null;
};

export type FeedPost = {
  id: string;
  authorId: string;
  author: string;
  location: string;
  avatar: string | null;
  images: string[];
  caption: string;
  createdAt: string;
  likes: number;
  commentCount: number;
  likedByViewer: boolean;
  connected: boolean;
  state: ConnectionState;
  connectionId: string | undefined;
  /** Non-deleted comments used by the card preview. */
  comments: FeedComment[];
};

export type FeedPage = {
  posts: FeedPost[];
  total: number;
};

export type PostDetail = FeedPost & {
  /** Full thread, including soft-deleted placeholders. */
  comments: FeedComment[];
};

const FEED_COLUMNS =
  "id, author_id, image_path, caption, moderation_status, created_at, author_name, author_country_code, author_city, author_avatar_url, comment_count, like_count";

type ConnectionContext = {
  stateByPeer: Map<string, { state: ConnectionState; id: string }>;
  acceptedPeers: Set<string>;
};

async function getConnectionContext(
  supabase: Supabase,
  viewerId: string,
): Promise<ConnectionContext> {
  const connections = unwrap(
    await supabase
      .from("connections")
      .select("id, requester_id, recipient_id, status")
      .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`),
  );

  const stateByPeer = new Map<string, { state: ConnectionState; id: string }>();
  const acceptedPeers = new Set<string>();

  for (const connection of connections ?? []) {
    const peer =
      connection.requester_id === viewerId ? connection.recipient_id : connection.requester_id;
    const state: ConnectionState =
      connection.status === "accepted"
        ? "connected"
        : connection.status === "declined"
          ? "declined"
          : connection.recipient_id === viewerId
            ? "received"
            : "requested";
    stateByPeer.set(peer, { state, id: connection.id });
    if (connection.status === "accepted") acceptedPeers.add(peer);
  }

  return { stateByPeer, acceptedPeers };
}

async function getCommentAuthors(supabase: Supabase, authorIds: string[]) {
  if (authorIds.length === 0) return new Map<string, { name: string; avatarUrl: string | null }>();

  const profiles = unwrap(
    await supabase
      .from("profiles_public")
      .select("id, display_name, avatar_url")
      .in("id", authorIds),
  );

  return new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      { name: profile.display_name ?? "", avatarUrl: profile.avatar_url },
    ]),
  );
}

async function hydratePosts(
  supabase: Supabase,
  rows: FeedRow[],
  viewerId: string,
  connections: ConnectionContext,
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];

  const postIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.author_id))];

  const [images, viewerLikes, comments] = await Promise.all([
    supabase
      .from("post_images")
      .select("post_id, storage_path, sort")
      .in("post_id", postIds)
      .order("sort", { ascending: true }),
    supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", viewerId),
    supabase
      .from("post_comments")
      .select("id, post_id, author_id, parent_id, body, created_at, deleted_at")
      .in("post_id", postIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true }),
  ]);

  const imageRows = unwrap(images) ?? [];
  const likeRows = unwrap(viewerLikes) ?? [];
  const commentRows = unwrap(comments) ?? [];
  const commentAuthorIds = [...new Set(commentRows.map((comment) => comment.author_id))];
  const commentAuthors = await getCommentAuthors(supabase, commentAuthorIds);

  const imagesByPost = new Map<string, string[]>();
  for (const image of imageRows) {
    const list = imagesByPost.get(image.post_id) ?? [];
    list.push(image.storage_path);
    imagesByPost.set(image.post_id, list);
  }

  const likedIds = new Set(likeRows.map((like) => like.post_id));
  const commentsByPost = new Map<string, FeedComment[]>();
  for (const comment of commentRows) {
    const author = commentAuthors.get(comment.author_id);
    const list = commentsByPost.get(comment.post_id) ?? [];
    list.push({
      id: comment.id,
      postId: comment.post_id,
      authorId: comment.author_id,
      author: author?.name ?? "",
      avatar: null,
      body: comment.body,
      parentId: comment.parent_id,
      createdAt: comment.created_at,
      deletedAt: comment.deleted_at,
    });
    commentsByPost.set(comment.post_id, list);
  }

  const [postImages, avatars] = await Promise.all([
    createSignedImageUrls(
      supabase,
      "post-images",
      imageRows.map((image) => image.storage_path),
    ),
    createSignedImageUrls(supabase, "avatars", [
      ...authorIds.map((id) => {
        const row = rows.find((candidate) => candidate.author_id === id);
        return row?.author_avatar_url ?? null;
      }),
      ...commentRows.map((comment) => commentAuthors.get(comment.author_id)?.avatarUrl ?? null),
    ]),
  ]);

  // Resolve comment avatars once the signed map exists.
  for (const list of commentsByPost.values()) {
    for (const comment of list) {
      comment.avatar = resolveImageUrl(commentAuthors.get(comment.authorId)?.avatarUrl, avatars);
    }
  }

  return rows.map((row) => {
    const imagesForPost = imagesByPost.get(row.id) ?? (row.image_path ? [row.image_path] : []);
    const resolvedImages = imagesForPost
      .map((path) => resolveImageUrl(path, postImages))
      .filter((url): url is string => url !== null);
    const connection = connections.stateByPeer.get(row.author_id);

    const post: FeedPost = {
      id: row.id,
      authorId: row.author_id,
      author: row.author_name ?? "",
      location: [row.author_city, row.author_country_code].filter(Boolean).join(", "),
      avatar: resolveImageUrl(row.author_avatar_url, avatars),
      images: resolvedImages,
      caption: row.caption ?? "",
      createdAt: row.created_at ?? "",
      likes: row.like_count ?? 0,
      commentCount: row.comment_count ?? 0,
      likedByViewer: likedIds.has(row.id),
      connected: connections.acceptedPeers.has(row.author_id),
      state: connection?.state ?? "none",
      connectionId: connection?.id,
      comments: commentsByPost.get(row.id) ?? [],
    };

    return post;
  });
}

export async function getFeedPage({
  viewerId,
  filter,
  limit,
  offset,
}: {
  viewerId: string;
  filter: PostFilter;
  limit: number;
  offset: number;
}): Promise<FeedPage> {
  const supabase = await createClient();
  const connections = await getConnectionContext(supabase, viewerId);

  if (filter === "connectionsOnly" && connections.acceptedPeers.size === 0) {
    return { posts: [], total: 0 };
  }

  let request = supabase
    .from("posts_feed")
    .select(FEED_COLUMNS, { count: "exact" })
    .eq("moderation_status", "visible");

  if (filter === "connectionsOnly") {
    request = request.in("author_id", [...connections.acceptedPeers]);
  }
  if (filter === "spainLatam") {
    request = request.in("author_country_code", [...SPAIN_LATAM_COUNTRIES]);
  }

  const response = await request
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  const rows = (unwrap(response) ?? []) as unknown as FeedRow[];
  const total = response.count ?? rows.length;
  const posts = await hydratePosts(supabase, rows, viewerId, connections);

  return { posts, total };
}

export async function getPostComments(postId: string): Promise<FeedComment[]> {
  const supabase = await createClient();
  const rows = unwrap(
    await supabase
      .from("post_comments")
      .select("id, post_id, author_id, parent_id, body, created_at, deleted_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true }),
  );

  if (!rows || rows.length === 0) return [];

  const authorIds = [...new Set(rows.map((row) => row.author_id))];
  const authors = await getCommentAuthors(supabase, authorIds);
  const avatars = await createSignedImageUrls(
    supabase,
    "avatars",
    rows.map((row) => authors.get(row.author_id)?.avatarUrl ?? null),
  );

  return rows.map((row) => {
    const author = authors.get(row.author_id);
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.author_id,
      author: author?.name ?? "",
      avatar: resolveImageUrl(author?.avatarUrl, avatars),
      body: row.body,
      parentId: row.parent_id,
      createdAt: row.created_at,
      deletedAt: row.deleted_at,
    };
  });
}

export async function getPostDetail(viewerId: string, postId: string): Promise<PostDetail | null> {
  const supabase = await createClient();
  const row = unwrap(
    await supabase
      .from("posts_feed")
      .select(FEED_COLUMNS)
      .eq("id", postId)
      .eq("moderation_status", "visible")
      .maybeSingle(),
  ) as unknown as FeedRow | null;

  if (!row) return null;

  const connections = await getConnectionContext(supabase, viewerId);
  const [post] = await hydratePosts(supabase, [row], viewerId, connections);
  if (!post) return null;

  return {
    ...post,
    comments: await getPostComments(postId),
  };
}
