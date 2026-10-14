import type { Locale } from "@/lib/i18n/routing";

import type { LegalDocument } from "../types";
import { termsEn } from "./terms.en";
import { termsEs } from "./terms.es";

/**
 * Legal documents per locale. Content (not UI chrome) lives as readable
 * markdown in `terms.<locale>.ts` — see the marketplace-copy precedent. The
 * source of truth for the English text is `docs/ToS GL.md`.
 */
export const termsDocuments: Record<Locale, LegalDocument> = {
  en: {
    title: "Terms of Service",
    lastUpdated: "14 October 2026",
    body: termsEn,
  },
  es: {
    title: "Términos del Servicio",
    lastUpdated: "14 de octubre de 2026",
    body: termsEs,
  },
};
