/** A parsed block of legal content. */
export type LegalBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/** A localised legal document (content, not UI chrome — hence not next-intl). */
export type LegalDocument = {
  title: string;
  /** Human-readable, already localised (e.g. "14 October 2026"). */
  lastUpdated: string;
  /** Markdown-subset body — see `parseLegalContent`. */
  body: string;
};
