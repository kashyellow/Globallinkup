"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineAlert } from "@/components/ui/inline-alert";
import { BackLink } from "@/components/layout/back-link";
import { acceptConnectionAction, sendConnectRequestAction } from "@/features/connect/actions";
import { deletePostAction } from "@/features/posts/actions";
import { removePostAction } from "@/features/admin/actions";
import type { PostDetail } from "@/features/posts/queries";
import { ConnectDialog, type ConnectTarget } from "@/features/shared/connect-dialog";
import { usePendingAction } from "@/features/shared/use-pending-action";
import { useRefresh } from "@/features/shared/refresh-provider";
import { useRouter } from "@/lib/i18n/navigation";
import { PostCard } from "./post-card";
import { PostComments } from "./post-comments";

export function PostDetailView({
  post: initialPost,
  viewer,
}: {
  post: PostDetail;
  viewer: {
    id: string;
    name: string;
    avatar: string | null;
    isAdmin: boolean;
    canModerateComments: boolean;
    canConnect: boolean;
    canLike: boolean;
  };
}) {
  const t = useTranslations("Posts.detail");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { refresh } = useRefresh();
  const { isPending, run } = usePendingAction();
  const [post, setPost] = useState(initialPost);
  const [target, setTarget] = useState<ConnectTarget | null>(null);
  const [requested, setRequested] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthor = post.authorId === viewer.id;

  async function sendRequest(note: string): Promise<boolean> {
    if (!target) return false;
    const recipientId = target.id;
    const result = await run(`connect:${recipientId}`, async () => {
      setError(null);
      try {
        const response = await sendConnectRequestAction({ recipientId, note });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        setRequested(true);
        refresh();
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });
    return result ?? false;
  }

  async function accept() {
    if (!post.connectionId) return;
    await run(`accept:${post.connectionId}`, async () => {
      setError(null);
      try {
        const response = await acceptConnectionAction({ id: post.connectionId });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return;
        }
        setPost((current) => ({ ...current, state: "connected" }));
        refresh();
      } catch {
        setError(tCommon("actionError"));
      }
    });
  }

  async function remove() {
    const result = await run(`post:${post.id}`, async () => {
      setError(null);
      try {
        const response = viewer.isAdmin
          ? await removePostAction({ postId: post.id })
          : await deletePostAction({ postId: post.id });
        if (!response.ok) {
          setError(tCommon("actionError"));
          return false;
        }
        refresh();
        router.push("/posts");
        return true;
      } catch {
        setError(tCommon("actionError"));
        return false;
      }
    });

    if (result) setDeleteOpen(false);
  }

  return (
    <div className="mx-auto w-full max-w-[820px] px-margin-mobile pt-block-mobile pb-page-mobile md:px-margin md:pt-block md:pb-page">
      <BackLink label={t("back")} fallbackHref="/posts" />

      {error ? <InlineAlert className="mt-space-md">{error}</InlineAlert> : null}
      <h1 className="sr-only">
        {post.author}: {post.caption}
      </h1>

      <div className="mt-space-md flex flex-col gap-space-lg">
        <PostCard
          post={post}
          isAuthor={isAuthor}
          canDelete={viewer.isAdmin}
          canConnect={viewer.canConnect}
          canLike={viewer.canLike}
          requested={requested}
          busy={isPending(`accept:${post.connectionId ?? post.id}`)}
          showComments={false}
          onConnect={() =>
            setTarget({
              id: post.authorId,
              name: post.author,
              location: post.location,
              image: post.avatar,
              imageAlt: post.author,
            })
          }
          onAccept={() => void accept()}
          onDelete={() => setDeleteOpen(true)}
        />

        <PostComments
          postId={post.id}
          comments={post.comments}
          viewer={viewer}
          canModerate={viewer.canModerateComments}
        />
      </div>

      <ConnectDialog
        target={target}
        open={target !== null}
        onClose={() => setTarget(null)}
        onSend={sendRequest}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t("removeTitle")}
        body={t("removeBody")}
        confirmLabel={tCommon("confirmAction")}
        cancelLabel={tCommon("cancel")}
        pendingLabel={tCommon("processing")}
        pending={isPending(`post:${post.id}`)}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => void remove()}
      />
    </div>
  );
}
