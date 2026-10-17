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
const contactText = (max: number) =>
  z.union([z.literal(""), z.string().trim().max(max)]).optional();

export const savePersonaSchema = z
  .object({
    fullName: z.string().trim().min(2, "fullNameTooShort").max(120),
    country: z.string().trim().length(2, "countryInvalid"),
    city: z.string().trim().min(1, "cityRequired").max(120),
    dateOfBirth: z
      .union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "dobInvalid")])
      .optional(),
    languages: z.array(personaLanguageSchema).min(1, "languagesRequired").max(10),
    interests: z.array(z.string().trim().min(1).max(60)).min(3, "interestsRequired").max(20),
    bio: z.string().trim().min(1, "bioRequired").max(160),
    whatsapp: contactText(40),
    telegram: contactText(60),
    instagram: contactText(60),
    facebook: contactText(80),
    tiktok: contactText(60),
    x: contactText(60),
    /** The active locale, sent by the client (Server Actions have no route). */
    locale: z.enum(["en", "es"]),
  })
  .refine(
    (value) =>
      [value.whatsapp, value.telegram, value.instagram, value.facebook, value.tiktok, value.x].some(
        (channel) => channel !== undefined && channel.trim().length > 0,
      ),
    { message: "contactRequired", path: ["whatsapp"] },
  );

export type SavePersonaInput = z.infer<typeof savePersonaSchema>;
