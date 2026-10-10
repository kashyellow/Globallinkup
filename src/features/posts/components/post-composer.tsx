"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { CURRENT_USER } from "@/lib/brand";
import { cn } from "@/lib/utils";

type PublishState = "idle" | "publishing" | "posted";

export function PostComposer() {
  const t = useTranslations("Posts.composer");
  const [text, setText] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [publishState, setPublishState] = useState<PublishState>("idle");
  const [showEmptyPrompt, setShowEmptyPrompt] = useState(false);
  const [lang, setLang] = useState<"enEs" | "auto">("enEs");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function publish() {
    if (text.trim() === "") {
      setShowEmptyPrompt(true);
      inputRef.current?.focus();
      return;
    }

    setPublishState("publishing");
    setTimeout(() => {
      setPublishState("posted");
      setText("");
      setShowPreview(false);

      setTimeout(() => {
        setPublishState("idle");
        setShowEmptyPrompt(false);
      }, 1800);
    }, 700);
  }

  return (
    <section className="rounded-xl border border-outline-variant bg-surface-low p-space-lg shadow-sm">
      <div className="flex items-start gap-space-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt={CURRENT_USER.name}
          className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-outline-variant"
          src={CURRENT_USER.avatarUrl}
        />

        <div className="flex flex-1 flex-col gap-space-md">
          <textarea
            ref={inputRef}
            rows={2}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={showEmptyPrompt ? t("emptyPrompt") : t("placeholder")}
            className="w-full resize-none rounded-lg border border-outline-variant bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-all placeholder:text-secondary focus:border-border-dark focus:ring-1 focus:ring-primary focus:outline-none"
          />

          <div className="flex flex-col items-stretch justify-between gap-space-sm pt-space-xs sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center gap-space-xs">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-strong transition-colors hover:bg-surface-variant hover:text-on-surface">
                <Icon name="add_photo_alternate" className="text-lg text-primary" />
                <span>{t("uploadPhoto")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={() => setShowPreview(true)}
                />
              </label>

              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container px-3 py-1.5 font-label-md text-label-md text-on-surface-strong transition-colors hover:bg-surface-variant hover:text-on-surface"
              >
                <Icon name="pin_drop" className="text-lg text-secondary" />
                <span>{t("addLocation")}</span>
              </button>

              <div className="flex items-center rounded-lg border border-outline-variant bg-surface-container p-0.5">
                <button
                  type="button"
                  onClick={() => setLang("enEs")}
                  className={cn(
                    "rounded px-2 py-1 font-label-caps text-label-caps transition-colors",
                    lang === "enEs"
                      ? "bg-secondary-container-alt font-semibold text-primary shadow-sm"
                      : "text-secondary hover:text-on-surface",
                  )}
                >
                  {t("languageEnEs")}
                </button>
                <button
                  type="button"
                  onClick={() => setLang("auto")}
                  className={cn(
                    "rounded px-2 py-1 font-label-caps text-label-caps transition-colors",
                    lang === "auto"
                      ? "bg-secondary-container-alt font-semibold text-primary shadow-sm"
                      : "text-secondary hover:text-on-surface",
                  )}
                >
                  {t("languageAuto")}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={publish}
              disabled={publishState === "publishing"}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary-container px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover disabled:opacity-80"
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

          {showPreview ? (
            <div className="mt-2 flex flex-col gap-2 rounded-lg border border-outline-variant bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-label-caps text-secondary">
                  {t("previewTitle")}
                </span>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="flex items-center text-xs text-secondary hover:text-error"
                >
                  <Icon name="close" className="text-sm" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded border border-outline-variant bg-surface-variant">
                  <Icon name="image" className="text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface">
                    {t("previewFileName")}
                  </p>
                  <p className="font-body-sm text-body-sm text-secondary">{t("previewMeta")}</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
