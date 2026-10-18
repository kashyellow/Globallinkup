"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { uploadImageAction } from "@/features/media/actions";
import { createPostAction } from "@/features/posts/actions";
import { useRouter } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type PublishState = "idle" | "publishing" | "posted";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Shared shape for the attachment button. */
const ATTACH_BASE =
  "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3.5 py-2 font-label-md text-label-md transition-colors duration-300 hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px";

export function PostComposer({
  viewerName,
  viewerAvatar,
}: {
  viewerName: string;
  viewerAvatar: string | null;
}) {
  const t = useTranslations("Posts.composer");
  const router = useRouter();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const canPublish = text.trim() !== "" && file !== null;

  async function publish() {
    if (text.trim() === "" || !file) {
      setShowEmptyPrompt(true);
      inputRef.current?.focus();
      return;
    }

    setPublishState("publishing");

    const formData = new FormData();
    formData.set("bucket", "post-images");
    formData.set("file", file);
    const upload = await uploadImageAction(formData);
    if (!upload.ok) {
      setPublishState("idle");
      return;
    }

    const created = await createPostAction({ caption: text, imagePath: upload.path });
    if (!created.ok) {
      setPublishState("idle");
      return;
    }

    setPublishState("posted");
    setText("");
    setFile(null);
    router.refresh();

    setTimeout(() => setPublishState("idle"), 1800);
  }

  return (
    <section className="bezel-tray">
      <div
        className="overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-col gap-space-md p-space-md sm:p-space-lg">
          <div className="flex min-w-0 items-center gap-space-sm">
            {viewerAvatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={viewerName}
                  className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
                  src={viewerAvatar}
                />
              </>
            ) : (
              <DefaultAvatar className="h-9 w-9 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <span className="min-w-0 truncate font-label-lg text-label-lg font-semibold text-on-surface">
              {viewerName}
            </span>
          </div>

          <textarea
            ref={inputRef}
            rows={3}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={showEmptyPrompt ? t("emptyPrompt") : t("placeholder")}
            className={cn(
              "w-full resize-none rounded-2xl border bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              showEmptyPrompt
                ? "border-danger-border-strong"
                : "border-outline-variant hover:border-outline focus:border-primary",
            )}
          />

          {file ? (
            <div className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface p-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-label-md text-label-md font-semibold tracking-[0.08em] text-primary uppercase">
                  {t("previewTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label={t("previewTitle")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-outline-variant bg-surface-variant">
                  <Icon name="image" className="text-secondary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-md text-label-md text-on-surface">
                    {file.name}
                  </p>
                  <p className="truncate font-body-sm text-body-sm text-secondary">
                    {t("previewMeta")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-space-sm border-t border-outline-variant bg-surface-container p-space-md sm:flex-row sm:items-center sm:justify-between sm:p-space-lg">
          <div className="-mx-space-md no-scrollbar flex items-center gap-space-xs overflow-x-auto px-space-md sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            <label className={cn(ATTACH_BASE, "cursor-pointer text-on-surface")}>
              <Icon name="add_photo_alternate" className="text-lg text-primary" />
              <span>{t("uploadPhoto")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void publish()}
            disabled={publishState === "publishing"}
            className={cn(
              "inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full px-6 font-label-lg text-label-lg font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-80",
              EASE,
              publishState === "posted"
                ? "bg-success-container text-success-text"
                : canPublish
                  ? "bg-primary text-on-primary hover:bg-primary-hover"
                  : "border border-outline-variant bg-surface-low text-text-muted hover:border-outline hover:text-secondary",
            )}
          >
            <Icon
              name={
                publishState === "publishing"
                  ? "progress_activity"
                  : publishState === "posted"
                    ? "check"
                    : "send"
              }
              className={cn(
                "text-lg",
                publishState === "publishing" && "animate-spin",
                publishState === "posted" && "text-base",
              )}
            />
            <span>
              {publishState === "publishing"
                ? t("publishing")
                : publishState === "posted"
                  ? t("posted")
                  : t("publish")}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
