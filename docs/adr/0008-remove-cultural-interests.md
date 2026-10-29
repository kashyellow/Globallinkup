# ADR 0008 — Remove cultural interests

- **Status:** accepted (implemented 2026-10-30)
- **Date:** 2026-10-30
- **Supersedes:** PRD FR-2.2, FR-3.2 and FR-4.2 where they list interests; PRD
  OQ-6 (interest as a discovery filter) and OQ-12 (interest tags); the S6
  interest-catalog design in `docs/CONTEXT.md`.

## Context

Cultural interests ran through the whole product:

- **Register / edit profile:** a required field (at least 3, at most 20),
  chosen from eight seeded tags or created as custom labels.
- **Catalog (S6):** custom labels were registered in `interest_catalog` as
  `pending` (3 new per member per 24 h) and only became suggestions after an
  admin approved them. Rejecting a pending label removed it from its creator's
  profile.
- **Member views:** chips on the Discover card, the persona page, the member's
  own profile ("Cultural Focus"), the connection cards and the verification
  summary; interest text was part of Discover and Connections search.
- **Admin portal:** the Interest Catalog tab and its review queue, the
  `interests.review` capability, a "Pending interests" overview card, the
  `interest` audit filter, and `interest.approved` / `interest.rejected`
  member notifications.

The project owner asked for the feature to be removed end to end, from
registration to the admin portal, including the database.

## Decision

Remove cultural interests entirely. Migration
`20261030120000_remove_interests.sql`:

1. rebuilds the Discover search text without interests (`profile_search_text`
   drops its `p_interests` argument; `interest_search_text` is dropped) and
   recomputes `profiles.search_text`;
2. recreates `profiles_public` without `interests` (and `posts_feed`, which
   depends on it, unchanged) and `discover_personas` without the column;
3. recreates `save_persona` without `p_interests`;
4. drops `register_custom_interests`, `review_interest`, `interest_catalog`,
   its helpers and the `interest_status` type, then the
   `profiles.interests` column and its length constraint;
5. rebuilds `notification_type` without the two interest values (rows of those
   types are deleted first);
6. removes `interests.review` from every role and from `record_audit()`.

Audit history is append-only and is kept: past `interest.*` rows stay readable
under the "All" filter.

The app, seed, RLS suite, unit and e2e tests, translations (EN/ES) and the
`cmdk` dependency (used only by the interest picker) follow.

## Consequences

- **Data loss, not reversible by a later migration.** Every member's interests
  and the whole catalog are deleted when the migration runs on a database.
  Take a backup before pushing it to production if the data may ever be needed.
- Discover and Connections search match on name, city, country, headline and
  languages only.
- Registration is one field shorter; existing members do not need to resubmit.
- Sub-admin roles that held only `interests.review` lose that desk; an owner may
  need to reassign them.
- Bringing interests back later means a new design and migration, not a revert.

## Alternatives considered

- **Remove from the app, keep the schema and data.** Reversible, and the data
  would survive for a later return of the feature. Rejected: the owner asked
  for a full removal including the database.

## Follow-ups

- Back up production (or export `profiles.interests` and `interest_catalog`)
  before `supabase db push` applies the migration there.
- Confirm with the client that removing interests from the original brief
  (`docs/PROJECT.md`) is intended, and record their wording in the next
  feedback round.
