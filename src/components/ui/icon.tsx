import { cn } from "@/lib/utils";

/**
 * Renders a Material Symbols glyph. The icon font stylesheet is loaded in the
 * locale layout; sizing/color are controlled with Tailwind text utilities.
 */
export function Icon({
  name,
  className,
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined", className)}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
