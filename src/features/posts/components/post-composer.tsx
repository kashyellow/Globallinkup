"use client";

import type { CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Spinner } from "@/components/ui/spinner";
import { uploadImageAction } from "@/features/media/actions";
import { createPostAction } from "@/features/posts/actions";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";

type PublishState = "idle" | "publishing" | "posted";
type PublishStage = "uploading" | "saving" | null;

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const MAX_CAPTION = 600;
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

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
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [stage, setStage] = useState<PublishStage>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function setPreview(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = next ? URL.createObjectURL(next) : null;
    previewRef.current = url;
    setPreviewUrl(url);
  }

  const canPublish = text.trim() !== "" && file !== null && text.length <= MAX_CAPTION;

  function chooseFile(next: File | null) {
    setError(null);
    if (!next) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(next.type) || next.size > MAX_BYTES) {
      setError(t("uploadError"));
      return;
    }
    setFile(next);
    setPreview(next);
  }

  async function publish() {
    if (text.trim() === "") {
      setError(t("emptyPrompt"));
      inputRef.current?.focus();
      return;
    }
    if (text.length > MAX_CAPTION) {
      setError(t("captionTooLong"));
      return;
    }
    if (!file) {
      setError(t("photoRequired"));
      return;
    }

    setError(null);
    setPublishState("publishing");
    setStage("uploading");

    const formData = new FormData();
    formData.set("bucket", "post-images");
    formData.set("file", file);

    try {
      const upload = await uploadImageAction(formData);
      if (!upload.ok) {
        setError(t("uploadError"));
        setPublishState("idle");
        setStage(null);
        return;
      }

      setStage("saving");
      const created = await createPostAction({ caption: text, imagePath: upload.path });
      if (!created.ok) {
        setError(t("publishError"));
        setPublishState("idle");
        setStage(null);
        return;
      }
    } catch {
      setError(t("publishError"));
      setPublishState("idle");
      setStage(null);
      return;
    }

    setPublishState("posted");
    setStage(null);
    setText("");
    setFile(null);
    setPreview(null);
    refresh();

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
            maxLength={MAX_CAPTION}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            disabled={publishState === "publishing"}
            placeholder={t("placeholder")}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "composer-error" : undefined}
            className={cn(
              "w-full resize-none rounded-2xl border bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-70",
              error
                ? "border-danger-border-strong"
                : "border-outline-variant hover:border-outline focus:border-primary",
            )}
          />

          <div className="flex flex-wrap items-center justify-between gap-space-xs font-body-sm text-body-sm text-secondary">
            <span>{t("emptyPrompt")}</span>
            <span className="tabular-nums">
              {text.length} / {MAX_CAPTION}
            </span>
          </div>

          {error ? (
            <div id="composer-error">
              <InlineAlert>{error}</InlineAlert>
            </div>
          ) : null}

          {file ? (
            <div className="flex flex-col gap-space-sm rounded-2xl border border-outline-variant bg-surface p-space-sm">
              <div className="flex items-center justify-between gap-space-sm">
                <span className="font-label-md text-label-md font-semibold tracking-[0.08em] text-primary uppercase">
                  {t("previewTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                  }}
                  disabled={publishState === "publishing"}
                  aria-label={t("previewTitle")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>
              <div className="flex items-center gap-space-md">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-variant">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={file.name} src={previewUrl} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Icon name="image" className="text-secondary" />
                    </div>
                  )}
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
                disabled={publishState === "publishing"}
                onChange={(event) => {
                  chooseFile(event.target.files?.[0] ?? null);
                  event.target.value = "";
                }}
              />
            </label>
          </div>

          <button
            type="button"
            onClick={() => void publish()}
            disabled={publishState === "publishing"}
            aria-busy={publishState === "publishing" || undefined}
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
            {publishState === "publishing" ? (
              <Spinner className="h-5 w-5 text-current" label={tCommon("processing")} />
            ) : (
              <Icon
                name={publishState === "posted" ? "check" : "send"}
                className={cn("text-lg", publishState === "posted" && "text-base")}
              />
            )}
            <span>
              {publishState === "publishing"
                ? stage === "uploading"
                  ? tCommon("uploading")
                  : tCommon("saving")
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
