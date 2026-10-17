"use client";

import type { CSSProperties, ReactNode } from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { POSTS, type Post } from "../data";
import { MAP_HEIGHT, MAP_WIDTH, WORLD_MAP_PATH, project } from "./world-map";

type Place = {
  /** The `location` string posts are filtered by. */
  location: string;
  city: string;
  country: string;
  count: number;
  x: number;
  y: number;
};

/** One pin per distinct location, busiest first. */
function collectPlaces(posts: Post[]): Place[] {
  const byLocation = new Map<string, Place>();

  for (const post of posts) {
    const seen = byLocation.get(post.location);
    if (seen) {
      seen.count += 1;
      continue;
    }
    const [city, country = ""] = post.location.split(", ");
    const { x, y } = project(post.coords.lat, post.coords.lng);
    byLocation.set(post.location, {
      location: post.location,
      city,
      country,
      count: 1,
      x,
      y,
    });
  }

  return [...byLocation.values()].sort((a, b) => b.count - a.count || a.city.localeCompare(b.city));
}

export function PostsMap({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (location: string | null) => void;
}) {
  const t = useTranslations("Posts.map");
  const places = collectPlaces(POSTS);
  // Ties a chip to its pin, so hovering the name lights up the dot on the map.
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="bezel-tray" aria-labelledby="posts-map-title">
      <div
        className="flex flex-col overflow-hidden bezel-core"
        style={{ "--bezel-core-bg": "var(--color-surface-low)" } as CSSProperties}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-space-md gap-y-1 px-space-lg pt-space-md">
          <h2
            id="posts-map-title"
            className="font-headline-sm text-headline-sm font-semibold text-on-surface"
          >
            {t("title")}
          </h2>
          <p className="font-body-sm text-body-sm text-secondary">{t("hint")}</p>
        </div>

        <div className="relative mt-space-sm h-[220px] w-full sm:h-[280px] lg:h-[340px]">
          <svg
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            className="absolute inset-0 h-full w-full"
          >
            <path d={WORLD_MAP_PATH} fillRule="evenodd" className="fill-outline-strong/55" />
          </svg>

          {places.map((place) => {
            const active = selected === place.location;
            const lit = active || hovered === place.location;
            return (
              <button
                key={place.location}
                type="button"
                aria-pressed={active}
                aria-label={`${place.city}, ${place.country}`}
                title={`${place.city}, ${place.country}`}
                onClick={() => onSelect(active ? null : place.location)}
                onMouseEnter={() => setHovered(place.location)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(place.location)}
                onBlur={() => setHovered(null)}
                style={{ left: `${place.x}%`, top: `${place.y}%` }}
                className="group absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute h-6 w-6 rounded-full transition-colors duration-300",
                    lit ? "bg-primary/30" : "bg-transparent",
                  )}
                />
                <span
                  aria-hidden
                  className={cn(
                    "relative h-2.5 w-2.5 rounded-full ring-2 ring-surface-low transition-colors duration-300",
                    lit ? "bg-primary" : "bg-on-surface",
                  )}
                />
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-outline-variant px-space-lg py-space-sm">
          <Chip active={selected === null} onClick={() => onSelect(null)}>
            {t("all")}
          </Chip>
          {places.map((place) => (
            <Chip
              key={place.location}
              active={selected === place.location}
              onClick={() => onSelect(selected === place.location ? null : place.location)}
              onHover={(on) => setHovered(on ? place.location : null)}
            >
              <span className="font-semibold">{place.city}</span>
              <span className="text-text-muted">{t("posts", { count: place.count })}</span>
            </Chip>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  onHover,
  children,
}: {
  active: boolean;
  onClick: () => void;
  onHover?: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      onFocus={() => onHover?.(true)}
      onBlur={() => onHover?.(false)}
      aria-pressed={active}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 font-label-md text-label-md transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
        active
          ? "border-primary bg-primary/15 text-on-surface"
          : "border-outline-variant text-secondary hover:border-outline-hover hover:text-on-surface",
      )}
    >
      {children}
    </button>
  );
}
