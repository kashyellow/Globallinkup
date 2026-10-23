import { cn } from "@/lib/utils";

/**
 * Inline progress indicator. The label is announced to assistive tech, while the
 * visual ring stays `aria-hidden` so screen readers do not repeat the animation.
 */
export function Spinner({ className, label }: { className?: string; label: string }) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <span
        aria-hidden
        className={cn(
          "h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current motion-reduce:animate-none",
          className,
        )}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
