import { cn } from "@/lib/utils";

/**
 * Neutral silhouette shown wherever a member has no photo yet.
 *
 * Deliberately not a stock portrait: an unfamiliar face on someone's own
 * dossier or review card reads as a bug, and on the review page it looks like
 * the wrong person is being approved.
 */
export function DefaultAvatar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex items-center justify-center bg-surface-variant text-outline-variant",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-1/2 w-1/2">
        <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
      </svg>
    </span>
  );
}
