import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { PostDetailView } from "@/features/posts/components/post-detail-view";
import { getPostDetail } from "@/features/posts/queries";
import { getServerClient, requireApprovedUser } from "@/lib/auth";
import { createSignedImageUrl } from "@/lib/storage";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Posts.detail" });
  return { title: t("metaTitle") };
}

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, profile } = await requireApprovedUser();
  const { id } = await params;
  const post = await getPostDetail(user.id, id);
  if (!post) notFound();

  const supabase = await getServerClient();
  const avatarPath = profile.avatar_url;
  const avatar =
    !avatarPath || !supabase
      ? null
      : avatarPath.startsWith("http")
        ? avatarPath
        : await createSignedImageUrl(supabase, "avatars", avatarPath);

  return (
    <PostDetailView post={post} viewer={{ id: user.id, name: profile.display_name, avatar }} />
  );
}
