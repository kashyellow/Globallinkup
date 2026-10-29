import type { Database } from "@/types/database";

import type { ConnectState, LanguageLevel, Persona, PersonaLanguage } from "./data";

/** S3a — row → UI DTO. Mechanical by design (README §5). */

type ProfilePublicRow = Database["public"]["Views"]["profiles_public"]["Row"];

/**
 * The narrow column set the list queries actually select. `languages` is
 * widened because the Discover RPC types it as nullable `Json` while the view
 * types it non-null; `parseLanguages` accepts either.
 */
export type PersonaRow = Pick<
  ProfilePublicRow,
  | "id"
  | "display_name"
  | "country_code"
  | "city"
  | "avatar_url"
  | "badge"
  | "approval_status"
  | "age"
> & { languages: unknown };

const LANGUAGE_LEVELS: readonly LanguageLevel[] = [
  "native",
  "fluent",
  "advanced",
  "conversational",
  "proficient",
  "basic",
];

function parseLanguages(value: unknown): PersonaLanguage[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const code = (entry as { code?: unknown }).code;
    const level = (entry as { level?: unknown }).level;
    if (typeof code !== "string" || code.length === 0) return [];
    const safeLevel = LANGUAGE_LEVELS.includes(level as LanguageLevel)
      ? (level as LanguageLevel)
      : "fluent";
    return [{ code, level: safeLevel }];
  });
}

export function mapPersonaRow(
  row: PersonaRow,
  options: { connectState: ConnectState; imageUrl: string | null; connectionId?: string },
): Persona {
  return {
    id: row.id ?? "",
    name: row.display_name ?? "",
    age: row.age ?? 0,
    countryCode: row.country_code ?? "",
    location: [row.city, row.country_code].filter(Boolean).join(", "),
    image: options.imageUrl,
    imageAlt: row.display_name ?? "",
    languages: parseLanguages(row.languages),
    state: options.connectState,
    connectionId: options.connectionId,
    badge: options.connectState === "connected" ? "directContact" : undefined,
  };
}
