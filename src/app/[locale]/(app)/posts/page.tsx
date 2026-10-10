import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PostsView } from "@/features/posts/components/posts-view";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Posts" });
  return { title: t("title") };
}

export default function PostsPage() {
  return <PostsView />;
}
