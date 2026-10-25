"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { MediaImage } from "@/components/ui/media-image";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Multi-image post frame. One image renders as a plain photo; two or more get
 * arrow controls, a dot rail and touch swipe. The active index is local to the
 * card so each post remembers where the viewer was while scrolling.
 */
export function PostCarousel({
  images,
  caption,
  className,
  eager = false,
}: {
  images: string[];
  caption: string;
  className?: string;
  eager?: boolean;
}) {
  const t = useTranslations("Posts.carousel");
  const [index, setIndex] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = images.length;
  const active = count > 0 ? Math.min(index, count - 1) : 0;

  function move(next: number) {
    if (count < 2) return;
    setIndex((next + count) % count);
  }

  return (
    <div
      className={cn(
        "group relative aspect-[4/3] w-full overflow-hidden border-y border-outline-variant bg-surface",
        className,
      )}
      role="group"
      aria-label={t("label")}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(active - 1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(active + 1);
        }
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const end = event.changedTouches[0]?.clientX ?? touchX.current;
        const delta = end - touchX.current;
        touchX.current = null;
        if (Math.abs(delta) > 40) move(active + (delta < 0 ? 1 : -1));
      }}
    >
      <MediaImage
        src={images[active] ?? null}
        alt={caption}
        wrapperClassName="h-full w-full"
        className={cn(
          "transition-transform duration-700 ease-out group-hover:scale-[1.02] motion-reduce:transform-none",
        )}
        loading={eager ? "eager" : "lazy"}
      />

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => move(active - 1)}
            aria-label={t("previous")}
            className={cn(
              "absolute top-1/2 left-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              EASE,
            )}
          >
            <Icon name="arrow_back" className="text-xl" />
          </button>
          <button
            type="button"
            onClick={() => move(active + 1)}
            aria-label={t("next")}
            className={cn(
              "absolute top-1/2 right-3 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
              EASE,
            )}
          >
            <Icon name="arrow_forward" className="text-xl" />
          </button>

          <div
            className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label={t("slides")}
          >
            {images.map((_, dot) => (
              <button
                key={dot}
                type="button"
                role="tab"
                aria-selected={dot === active}
                aria-label={t("slide", { number: dot + 1, total: count })}
                onClick={() => setIndex(dot)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                  dot === active ? "w-5 bg-white" : "w-2 bg-white/55 hover:bg-white/80",
                )}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
