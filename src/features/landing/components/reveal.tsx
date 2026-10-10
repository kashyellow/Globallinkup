"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll reveal wrapper.
 *
 * Uses IntersectionObserver rather than a scroll listener, and arms itself only
 * after mount so the pre-hydration markup is already visible: with JS disabled
 * the content renders normally instead of staying at `opacity: 0`.
 *
 * The visual states live in `globals.css` (`.reveal[data-armed]`) so the
 * transition stays on the compositor and honours `prefers-reduced-motion`
 * without a JS branch here.
 */
export function Reveal({
  children,
  as: Tag = "div",
  delay = 0,
  className,
}: {
  children: ReactNode;
  as?: ElementType;
  /** Stagger offset in ms, applied as a CSS custom property. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [armed, setArmed] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Arm first, then observe on the next frame, so arming and revealing never
    // land in the same paint (which would skip the transition entirely).
    setArmed(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("reveal", className)}
      data-armed={armed || undefined}
      data-shown={shown || undefined}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
