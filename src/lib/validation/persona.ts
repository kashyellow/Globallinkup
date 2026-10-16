import { z } from "zod";

/**
 * Persona input schema (S2). The create/resubmit form collects these fields;
 * the Server Action validates before writing `profiles` + `profile_private` +
 * `contact_details`.
 */

export const personaLanguageSchema = z.object({
  code: z.string().trim().min(2).max(8),
  level: z.string().trim().min(2).max(20),
});

/** Empty strings from optional inputs are allowed and mapped to null. */
const optionalText = (max: number) =>
  z.union([z.literal(""), z.string().trim().max(max)]).optional();

export const savePersonaSchema = z.object({
  fullName: z.string().trim().min(2, "fullNameTooShort").max(120),
  country: z.string().trim().length(2, "countryInvalid"),
  city: z.string().trim().min(1, "cityRequired").max(120),
  originFlavor: optionalText(120),
  dateOfBirth: z
    .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dobInvalid")])
    .optional(),
  languages: z.array(personaLanguageSchema).min(1, "languagesRequired").max(10),
  interests: z.array(z.string().trim().min(1).max(60)).min(3, "interestsRequired").max(20),
  bio: z.string().trim().min(1, "bioRequired").max(160),
  instagram: optionalText(60),
  chat: optionalText(120),
  /** The active locale, sent by the client (Server Actions have no route). */
  locale: z.enum(["en", "es"]),
});

export type SavePersonaInput = z.infer<typeof savePersonaSchema>;
