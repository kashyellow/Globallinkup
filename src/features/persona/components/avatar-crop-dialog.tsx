"use client";

import "react-easy-crop/react-easy-crop.css";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import Cropper, { type Area, type Point } from "react-easy-crop";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { useDialogA11y } from "@/features/shared/use-dialog-a11y";
import { cn } from "@/lib/utils";

const OUTPUT_SIZE = 1024;

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image load failed"));
    image.src = src;
  });
}

async function cropToFile(src: string, area: Area): Promise<File> {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas unavailable");

  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.92),
  );
  if (!blob) throw new Error("crop failed");
  return new File([blob], "avatar.webp", { type: "image/webp" });
}

/**
 * Circular avatar crop with drag/zoom. The uploaded file is already square, so
 * every later surface can use one consistent `object-cover` treatment.
 */
export function AvatarCropDialog({
  image,
  open,
  onCancel,
  onConfirm,
}: {
  image: string | null;
  open: boolean;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}) {
  const t = useTranslations("PersonaForm.crop");
  const tCommon = useTranslations("Common");
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const containerRef = useDialogA11y(open, onCancel, closeRef);

  async function apply() {
    if (!image || !area || busy) return;
    setBusy(true);
    setError(false);
    try {
      const file = await cropToFile(image, area);
      onConfirm(file);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      aria-hidden={!open}
      inert={!open}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) onCancel();
      }}
      className={cn(
        "fixed inset-0 z-[95] flex items-end justify-center bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm transition-opacity duration-300 sm:items-center sm:p-space-lg",
        open ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-title"
        className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-y-auto rounded-t-[1.5rem] border border-outline-variant bg-surface-low shadow-lift-lg sm:rounded-[1.5rem]"
      >
        <div className="flex items-start justify-between gap-space-md border-b border-outline-variant p-space-lg">
          <div>
            <p className="font-label-caps text-label-caps tracking-[0.16em] text-primary uppercase">
              {t("eyebrow")}
            </p>
            <h2
              id="avatar-crop-title"
              className="mt-1 font-headline-sm text-headline-sm font-semibold text-on-surface"
            >
              {t("title")}
            </h2>
            <p className="mt-1 font-body-sm text-body-sm text-secondary">{t("body")}</p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            aria-label={tCommon("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-outline-variant bg-surface-container text-on-surface transition-colors hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="relative h-[min(55dvh,32rem)] w-full shrink-0 bg-surface-container">
          {image ? (
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
              classes={{ cropAreaClassName: "border-2 border-white" }}
            />
          ) : null}
        </div>

        <div className="flex flex-col gap-space-md p-space-lg">
          <label className="flex flex-col gap-2">
            <span className="flex items-center justify-between font-label-md text-label-md font-semibold text-on-surface">
              <span>{t("zoom")}</span>
              <span className="font-normal text-secondary tabular-nums">{zoom.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              disabled={busy}
              className="h-2 w-full cursor-pointer accent-primary"
            />
          </label>

          {error ? (
            <p role="alert" className="font-body-sm text-body-sm text-danger-text">
              {t("error")}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-space-sm border-t border-outline-variant pt-space-md sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-outline-variant bg-surface-dim px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-surface transition-colors hover:border-outline-hover hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {tCommon("cancel")}
            </button>
            <button
              type="button"
              onClick={() => void apply()}
              disabled={busy || !area}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-space-lg py-2.5 font-label-lg text-label-lg font-semibold text-on-primary transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-60"
            >
              {busy ? (
                <Spinner className="h-4 w-4 text-current" label={tCommon("processing")} />
              ) : (
                <Icon name="crop" className="text-lg" />
              )}
              {t("apply")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
