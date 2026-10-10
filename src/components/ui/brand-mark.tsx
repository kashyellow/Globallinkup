/**
 * GlobalLinkup brand mark.
 *
 * The reference mockups embed a hosted logo image from `lh3.googleusercontent.com/aida/...`,
 * which returns 403 (the `/aida/` path is not publicly readable). This inline SVG
 * keeps the header/footer self-contained; swap it for the real asset when available.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="16" cy="16" r="13" />
      <ellipse cx="16" cy="16" rx="5.5" ry="13" />
      <path d="M3 16h26" />
      <path d="M5.5 9h21M5.5 23h21" strokeWidth="1.5" />
    </svg>
  );
}
