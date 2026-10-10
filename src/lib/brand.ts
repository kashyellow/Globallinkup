/** Demo asset placeholders ported from the reference designs. */

/**
 * Currently-signed-in demo user shown in the header / composer.
 *
 * Identity matches `PROFILE_IDENTITY` (the Profile page is the authoritative record).
 * The mockups disagreed — community/marketplace headers said "Sofia, 28 · Madrid" while
 * discover/landing/profile all say "Sofia Martínez, 27 · Barcelona"; the majority plus the
 * identity page win. Avatar is the same headshot the Profile page uses.
 */
export const CURRENT_USER = {
  name: "Sofia Martínez",
  meta: "27 · Barcelona",
  avatarUrl:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAATlSmkEIUqeeL2L5XxBOU6w03gzVzBw2Uzhhca7DwdYW4hDZd4o2AHMBhf1TzL67D6LizWd-FlfVA5rzm36kc_qs9lanO29UHXGB-OSFZtqfLJCv-9QAADdrJu-b1MpnO7Bk7BE5yKrjUuUxCafSczIqtPSB73rF_OXuT5UwFZcwTK2wqBodkDNA66r01n5t9K7H5kFx9Lg8ZtrZYW1pwWrb9focCtsu1qILGbUffIAcWXP7LwBQmuw",
} as const;

export const PENDING_REQUEST_COUNT = 2;
