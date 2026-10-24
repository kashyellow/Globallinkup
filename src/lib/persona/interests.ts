/**
 * Cultural-interest domain data shared by the persona form and the Server
 * Action. The eight built-in interests keep their bilingual labels in
 * `src/messages`; user-created labels live in `public.interest_catalog`.
 */

export const INTEREST_MIN = 3;
export const INTEREST_MAX = 20;
export const CUSTOM_INTEREST_MIN = 2;
export const CUSTOM_INTEREST_MAX = 40;

export const SEEDED_INTERESTS = [
  { key: "architecture", icon: "domain" },
  { key: "analogPhotography", icon: "camera_roll" },
  { key: "ceramicsCraft", icon: "handyman" },
  { key: "independentCinema", icon: "movie" },
  { key: "culinaryHeritage", icon: "restaurant" },
  { key: "hikingNature", icon: "forest" },
  { key: "literature", icon: "menu_book" },
  { key: "latinMusic", icon: "music_note" },
] as const;

export type SeededInterestKey = (typeof SEEDED_INTERESTS)[number]["key"];

export const SEEDED_INTEREST_KEYS: ReadonlySet<string> = new Set(
  SEEDED_INTERESTS.map((interest) => interest.key),
);

/** Case/space-insensitive key used for dedupe and catalog lookups. */
export function normalizeInterest(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * User-created labels are deliberately conservative: letters/accents, spaces,
 * apostrophes, hyphens, ampersands and periods only. Links, handles and long
 * digit strings would make the global suggestion list a spam surface.
 */
const CUSTOM_INTEREST_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} '’&.-]*$/u;
const LINK_OR_CONTACT_PATTERN = /(https?:\/\/|www\.|@|\.com\b|\b\d{7,}\b)/i;

export function normalizeCustomInterest(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

export function isValidCustomInterest(value: string): boolean {
  const normalized = normalizeCustomInterest(value);
  return (
    normalized.length >= CUSTOM_INTEREST_MIN &&
    normalized.length <= CUSTOM_INTEREST_MAX &&
    CUSTOM_INTEREST_PATTERN.test(normalized) &&
    !LINK_OR_CONTACT_PATTERN.test(normalized)
  );
}

export function interestsMatch(a: string, b: string): boolean {
  return normalizeInterest(a) === normalizeInterest(b);
}
