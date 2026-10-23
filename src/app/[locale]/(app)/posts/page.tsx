import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PostsView } from "@/features/posts/components/posts-view";
import { getFeed } from "@/features/posts/queries";
import { getServerClient, requireApprovedUser } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Posts" });
  return { title: t("title") };
}

export default async function PostsPage() {
  const { user, profile } = await requireApprovedUser();
  const supabase = await getServerClient();
  const avatarPath = profile.avatar_url;

  const [posts, avatar] = await Promise.all([
    getFeed(user.id),
    !avatarPath || !supabase
      ? Promise.resolve(null)
      : avatarPath.startsWith("http")
        ? Promise.resolve(avatarPath)
        : createSignedImageUrl(supabase, "avatars", avatarPath),
  ]);

  return <PostsView posts={posts} viewer={{ id: user.id, name: profile.display_name, avatar }} />;
}
