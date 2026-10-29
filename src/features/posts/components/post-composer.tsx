"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { DefaultAvatar } from "@/components/ui/default-avatar";
import { Icon } from "@/components/ui/icon";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MediaImage } from "@/components/ui/media-image";
import { Spinner } from "@/components/ui/spinner";
import { uploadImageAction } from "@/features/media/actions";
import { createPostAction } from "@/features/posts/actions";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { useRefresh } from "@/features/shared/refresh-provider";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";
const MAX_CAPTION = 600;
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 6;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

type DraftImage = { file: File; url: string };
type PublishState = "idle" | "publishing" | "posted";
type PublishStage = "uploading" | "saving" | null;

/** Floating composer trigger; the dialog is shared by mobile FAB and desktop CTA. */
export function PostComposerDialog({
  open,
  onClose,
  onPublished,
  viewerName,
  viewerAvatar,
}: {
  open: boolean;
  onClose: () => void;
  onPublished: () => void;
  viewerName: string;
  viewerAvatar: string | null;
}) {
  const t = useTranslations("Posts.composer");
  const tCommon = useTranslations("Common");
  const { refresh } = useRefresh();
  const [text, setText] = useState("");
  const [images, setImages] = useState<DraftImage[]>([]);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [stage, setStage] = useState<PublishStage>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const urlsRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const publishing = publishState === "publishing";

  const containerRef = useDialogA11y(
    open,
    () => {
      if (!publishing) onClose();
    },
    textareaRef,
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const url of urlsRef.current) URL.revokeObjectURL(url);
      urlsRef.current = [];
    };
  }, []);

  function resetDraft() {
    for (const url of urlsRef.current) URL.revokeObjectURL(url);
    urlsRef.current = [];
    setImages([]);
    setText("");
  }

  function addFiles(list: FileList | null) {
    setError(null);
    if (!list || list.length === 0) return;

    const incoming = Array.from(list);
    if (images.length + incoming.length > MAX_IMAGES) {
      setError(t("maxPhotos", { count: MAX_IMAGES }));
      return;
    }

    for (const file of incoming) {
      if (!ALLOWED_TYPES.includes(file.type) || file.size > MAX_BYTES) {
        setError(t("uploadError"));
        return;
      }
    }

    const next = incoming.map((file) => {
      const url = URL.createObjectURL(file);
      urlsRef.current.push(url);
      return { file, url };
    });
    setImages((current) => [...current, ...next]);
  }

  function removeImage(index: number) {
    setImages((current) => {
      const target = current[index];
      if (target) {
        URL.revokeObjectURL(target.url);
        urlsRef.current = urlsRef.current.filter((url) => url !== target.url);
      }
      return current.filter((_, position) => position !== index);
    });
  }

  function closeIfIdle() {
    if (!publishing) onClose();
  }

  async function publish() {
    if (text.trim() === "") {
      setError(t("emptyPrompt"));
      textareaRef.current?.focus();
      return;
    }
    if (text.length > MAX_CAPTION) {
      setError(t("captionTooLong"));
      return;
    }
    if (images.length === 0) {
      setError(t("photoRequired"));
      return;
    }
    if (images.length > MAX_IMAGES) {
      setError(t("maxPhotos", { count: MAX_IMAGES }));
      return;
    }

    setError(null);
    setPublishState("publishing");
    setStage("uploading");

    const paths: string[] = [];
    try {
      for (const image of images) {
        const formData = new FormData();
        formData.set("bucket", "post-images");
        formData.set("file", image.file);
        const upload = await uploadImageAction(formData);
        if (!upload.ok) {
          setError(t("uploadError"));
          setPublishState("idle");
          setStage(null);
          return;
        }
        paths.push(upload.path);
      }

      setStage("saving");
      const created = await createPostAction({ caption: text, imagePaths: paths });
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
    resetDraft();
    refresh();
    onPublished();
    timerRef.current = setTimeout(() => {
      setPublishState("idle");
      onClose();
    }, 900);
  }

  const canPublish =
    text.trim() !== "" && images.length > 0 && text.length <= MAX_CAPTION && !publishing;

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeIfIdle();
      }}
      className={cn(
        "fixed inset-0 z-[80] flex items-end justify-center bg-background/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="post-composer-title"
        aria-busy={publishing || undefined}
        className={cn(
          "flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:rounded-[1.5rem]",
          open ? "translate-y-0" : "translate-y-full sm:translate-y-4",
        )}
      >
        <div className="flex items-start justify-between gap-space-md border-b border-outline-variant p-space-lg">
          <div className="min-w-0">
            <p className="font-label-caps text-label-caps text-primary">{t("eyebrow")}</p>
            <h2
              id="post-composer-title"
              className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {t("dialogTitle")}
            </h2>
            <p className="mt-1 max-w-[48ch] font-body-sm text-body-sm text-secondary">
              {t("dialogBody")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeIfIdle}
            disabled={publishing}
            aria-label={t("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors duration-300 hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="flex flex-col gap-space-md p-space-lg">
          <div className="flex min-w-0 items-center gap-space-sm">
            {viewerAvatar ? (
              <MediaImage
                alt={viewerName}
                src={viewerAvatar}
                wrapperClassName="h-9 w-9 shrink-0 rounded-full ring-1 ring-outline-variant"
              />
            ) : (
              <DefaultAvatar className="h-9 w-9 shrink-0 rounded-full ring-1 ring-outline-variant" />
            )}
            <span className="min-w-0 truncate font-label-lg text-label-lg font-semibold text-on-surface">
              {viewerName}
            </span>
          </div>

          <textarea
            ref={textareaRef}
            rows={4}
            maxLength={MAX_CAPTION}
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              if (error) setError(null);
            }}
            disabled={publishing}
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

          {images.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((image, index) => (
                <div
                  key={image.url}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-outline-variant bg-surface-variant"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("photoAlt", { number: index + 1 })}
                    src={image.url}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={publishing}
                    aria-label={t("removePhoto", { number: index + 1 })}
                    className="absolute top-1.5 right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
                  >
                    <Icon name="close" className="text-base" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-space-sm">
            <label
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-outline-variant bg-surface-container px-4 font-label-md text-label-md text-on-surface transition-colors duration-300",
                "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:border-outline-hover hover:bg-surface-variant",
                publishing && "pointer-events-none opacity-50",
              )}
            >
              <Icon name="add_photo_alternate" className="text-lg text-primary" />
              <span>{t("uploadPhoto")}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                disabled={publishing}
                onChange={(event) => {
                  addFiles(event.target.files);
                  event.target.value = "";
                }}
              />
            </label>
            <span className="font-body-sm text-body-sm text-secondary tabular-nums">
              {t("photosCount", { count: images.length, max: MAX_IMAGES })}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-space-sm border-t border-outline-variant bg-surface-container p-space-lg sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body-sm text-body-sm text-secondary">{t("privacyNote")}</p>
          <div className="flex items-center justify-end gap-space-xs">
            <button
              type="button"
              onClick={closeIfIdle}
              disabled={publishing}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-low px-4 font-label-md text-label-md text-on-surface transition-colors duration-300 hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={!canPublish}
              aria-busy={publishing || undefined}
              className={cn(
                "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-label-lg text-label-lg font-semibold transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-60",
                EASE,
                publishState === "posted"
                  ? "bg-success-container text-success-text"
                  : canPublish
                    ? "bg-primary text-on-primary hover:bg-primary-hover"
                    : "bg-surface-container-high text-text-muted",
              )}
            >
              {publishing ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name={publishState === "posted" ? "check" : "send"} className="text-lg" />
              )}
              {publishing
                ? stage === "uploading"
                  ? tCommon("uploading")
                  : tCommon("saving")
                : publishState === "posted"
                  ? t("posted")
                  : t("publish")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
