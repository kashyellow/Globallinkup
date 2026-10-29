import { notFound } from "next/navigation";

/**
 * Locale-aware catch-all for unknown URLs. Without it, Next renders its bare
 * default 404 outside the `[locale]` shell; throwing `notFound()` here picks up
 * `[locale]/not-found.tsx` so the branded header/footer and translations stay.
 */
export default function CatchAllPage() {
  notFound();
}
