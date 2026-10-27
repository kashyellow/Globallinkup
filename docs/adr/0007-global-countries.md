# ADR 0007 — Global country coverage

- **Status:** accepted (implemented 2026-10-27)
- **Date:** 2026-10-27
- **Related:** [round 1, item 2](../feedback/2026-10-27-client-review.md)

## Context

`src/lib/persona/countries.ts` exports a hardcoded list of **nine** countries:

```ts
export const PLATFORM_COUNTRIES = ["ES", "MX", "CO", "AR", "US", "CR", "CL", "PE", "PT"];
```

It is the single source for three things:

1. the persona form's country `<select>`
   (`src/features/persona/components/create-persona-view.tsx`),
2. the discover/connections region filter
   (`src/features/persona/components/region-filter.tsx`, default when no
   `options` are passed),
3. server-side validation of the discover input
   (`src/features/persona/discover-actions.ts`, `z.enum(PLATFORM_COUNTRIES)`).

A member outside those nine cannot register at all, so the filter can never grow
by itself. That is why the earlier answer to the client ("countries will appear
automatically") was wrong.

`public.profiles.country_code` is a plain `text` column (no enum, no FK), and
`discover_personas(p_query, p_countries text[], ...)` already filters on an array
of codes. `public.profile_search_text()` includes the raw code (`"ES"`) but not
the country name.

## Decision

1. **Open registration to every ISO-3166-1 alpha-2 country.**
   - Replace `PLATFORM_COUNTRIES` with the full ISO set (a generated constant, not
     a 200-entry translation file).
   - Labels come from `Intl.DisplayNames([locale], { type: "region" })`, which is
     already localised for EN and ES and needs no i18n keys per country.
2. **Native `<select>` first.** All 249 options, ordered by their localised label
   (`sortedCountryCodes`, cached per locale). The OS picker already gives
   type-ahead on desktop and a searchable wheel on mobile, and the existing field
   keeps its style and its default (`ES` when the member has none). A custom
   combobox is a follow-up only if typing through the list proves annoying.
3. **Validate on both sides, at the level each side can enforce.**
   - Server action: `savePersonaSchema` upper-cases the value and refines it with
     `isIsoCountryCode`, so membership is checked against the full ISO set.
   - Database: `profiles_country_code_format` enforces the **shape**
     (`^[A-Z]{2}$`). It deliberately does not check membership — SQL has no ISO
     list, and shipping a 249-row table for a format guard is not worth it. Any
     write path that bypasses the action (a direct RPC call) still cannot store
     lower-case or longer junk.
4. **The discover filter is derived from data**, which is the client's actual
   expectation: the options are the distinct `country_code` values of approved
   members (with a count), so a country appears the day its first member is
   approved and disappears when the last one leaves. The filter remains
   searchable, and the request still validates against the ISO set rather than a
   fixed list.
5. **Search text keeps working.** Optionally extend `profile_search_text()` to
   include the English and Spanish country names so "Spain" and "España" both
   match a Spanish member; if included, the trigger must be reapplied to existing
   rows in the migration.

## Consequences

- Registration and moderation are no longer implicitly scoped to LatAm/Spain. The
  client should expect a wider mix of languages and time zones; nothing in the
  data model changes.
- The region filter must stay usable with up to ~250 options: order by member
  count desc, then alphabetical, with a search field.
- Country names are no longer translated by us, so a locale bundle change in
  `Intl` can change a label. Acceptable; the stored value is the code.
- Existing profiles keep their codes; no data migration is needed beyond the check
  constraint.
- `docs/PRD.md` mentions a LatAm/Europe focus; this ADR supersedes that for country
  coverage and should be reflected in `docs/CONTEXT.md` deviations.

## Alternatives considered

- **Keep the curated nine**: rejected — the client explicitly wants global reach,
  and the product name implies it.
- **Continent/region grouping instead of countries**: rejected as a first step; it
  hides the actual geography members care about. Could be added as a grouping on
  top later.
- **Free-text country field**: rejected — unsearchable, untranslatable, and it
  breaks the filter.
- **A `countries` table with translations**: rejected for now; `Intl.DisplayNames`
  gives the same result with zero rows to maintain.

## Follow-ups

- Replace `PLATFORM_COUNTRIES` usage in the form, filter, and Zod schema; keep the
  constant as a derived ISO list.
- Combobox component for country selection (form + filter).
- `discover-actions`: validate codes as ISO, not enum.
- Derived filter query: `select country_code, count(*) from profiles where
approval_status = 'approved' group by 1`.
- Migration: country-code check constraint; `save_persona` validation; optional
  country names in `profile_search_text()` + backfill.
- Tests: pgTAP for the constraint and RPC rejection; Playwright for registration
  with a non legacy country and for a filter driven by data.
