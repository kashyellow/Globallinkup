import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/** Shared primary CTA: forest-green pill with the icon in its own disc. */
export const CTA_PRIMARY = cn(
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-6 font-label-lg text-label-lg whitespace-nowrap text-on-primary shadow-lift-sm transition-[background-color,transform,box-shadow] duration-300",
  EASE,
  "hover:bg-primary-hover hover:shadow-lift-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px active:scale-[0.985]",
);

/** Secondary CTA: outlined pill that sits on sand or white. */
export const CTA_SECONDARY = cn(
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-primary/25 bg-transparent px-6 font-label-lg text-label-lg whitespace-nowrap text-primary transition-[background-color,border-color,transform] duration-300",
  EASE,
  "hover:border-primary/45 hover:bg-marketing-core focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
);

/** Gold CTA used only inside the dark closing panel. */
export const CTA_GOLD = cn(
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-gold px-6 font-label-lg text-label-lg whitespace-nowrap text-on-gold shadow-lift-sm transition-[background-color,transform] duration-300",
  EASE,
  "hover:bg-gold-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:translate-y-px active:scale-[0.985]",
);

/** Outlined CTA that sits on the forest panel. */
export const CTA_ON_DARK = cn(
  "group inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/25 bg-transparent px-6 font-label-lg text-label-lg whitespace-nowrap text-white transition-[background-color,border-color] duration-300",
  EASE,
  "hover:border-white/45 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
);

/** Trailing icon in a translucent disc, so the arrow never sits naked. */
export function CtaIcon({ name, tone = "dark" }: { name: string; tone?: "dark" | "gold" }) {
  return (
    <span
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full transition-transform duration-500",
        EASE,
        tone === "gold" ? "bg-on-gold/15" : "bg-on-primary/15",
        "group-hover:translate-x-0.5 group-hover:-translate-y-px",
      )}
    >
      <Icon name={name} className="text-[16px]" />
    </span>
  );
}

/** Tracked-caps eyebrow with the gold status dot used throughout the mockup. */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 font-label-caps text-label-caps tracking-[0.12em] uppercase",
        tone === "dark"
          ? "border-white/15 bg-white/5 text-gold"
          : "border-outline-variant bg-marketing-core/60 text-on-surface-variant",
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" />
      {children}
    </p>
  );
}
