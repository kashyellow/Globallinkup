"use client";

import type { CSSProperties } from "react";
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
    <section className="bezel-tray">
      <div
        className="bezel-core p-space-lg"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
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
              className="w-full resize-none rounded-[0.75rem] border border-outline-variant bg-surface-container p-space-md font-body-md text-body-md text-on-surface transition-colors duration-300 placeholder:text-text-muted hover:border-outline focus:border-primary focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />

            <div className="flex flex-col items-stretch justify-between gap-space-sm pt-space-xs sm:flex-row sm:items-center">
              <div className="flex flex-wrap items-center gap-space-xs">
                <label className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3.5 py-1.5 font-label-md text-label-md text-on-surface transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary hover:border-outline-hover hover:bg-surface-variant">
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
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-outline-variant bg-surface-container px-3.5 py-1.5 font-label-md text-label-md text-on-surface transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-outline-hover hover:bg-surface-variant focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px"
                >
                  <Icon name="pin_drop" className="text-lg text-secondary" />
                  <span>{t("addLocation")}</span>
                </button>

                <div className="flex items-center rounded-full border border-outline-variant bg-surface-container p-0.5">
                  <button
                    type="button"
                    onClick={() => setLang("enEs")}
                    className={cn(
                      "rounded-full px-3 py-1 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      lang === "enEs"
                        ? "bg-surface-container-highest font-semibold text-on-surface"
                        : "text-secondary hover:text-on-surface",
                    )}
                  >
                    {t("languageEnEs")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("auto")}
                    className={cn(
                      "rounded-full px-3 py-1 font-label-md text-label-md transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                      lang === "auto"
                        ? "bg-surface-container-highest font-semibold text-on-surface"
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
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px disabled:opacity-80"
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
              <div className="mt-2 flex flex-col gap-2 rounded-[0.75rem] border border-outline-variant bg-surface p-3">
                <div className="flex items-center justify-between">
                  <span className="font-label-lg text-label-lg font-semibold text-on-surface">
                    {t("previewTitle")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-secondary transition-colors duration-300 hover:bg-surface-container hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <Icon name="close" className="text-sm" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[0.75rem] border border-outline-variant bg-surface-variant">
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
      </div>
    </section>
  );
}
