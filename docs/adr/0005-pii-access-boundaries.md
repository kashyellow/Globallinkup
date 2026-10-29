# ADR 0005 — PII access boundaries

- **Status:** accepted (implemented 2026-10-27)
- **Date:** 2026-10-27
- **Related:** [round 1, item E](../feedback/2026-10-27-client-review.md),
  [ADR 0003 (audit)](./0003-audit-log-and-pii.md),
  [ADR 0002 (RBAC)](./0002-granular-admin-rbac.md)

## Context

Two tables hold data that is personal by nature:

| Table                    | Content                                                   | Policies today                                                    |
| ------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| `public.contact_details` | WhatsApp, Telegram, Instagram, Facebook, TikTok, X, email | owner, **admin**, plus `are_connected(...)` (accepted connection) |
| `public.profile_private` | `date_of_birth`                                           | owner, **admin**                                                  |

The product rule is already written down — "contact info is RLS-gated on an
accepted connection, never UI-hidden" (`docs/CONTEXT.md`) — but the **admin**
policy bypasses it for every admin. The admin users desk displays those channels
(`src/features/admin/queries.ts` selects `contact_details`, `users-tab.tsx`
renders a "Contact channels" block).

The client's position: contact details are PII and must be visible only to the
person who **consciously accepted** the connection request. Not to admins.

## Decision

1. **Drop `contact_details_select_admin`.** Contact channels are readable only by:
   - the owner (`contact_details_select_owner`), and
   - a member whose connection with the owner is `accepted`
     (`contact_details_select_connection` → `public.are_connected(...)`).
2. **Drop `profile_private_select_admin`.** Admins see `public.profile_age(id)`,
   never the raw birth date.
3. **Remove the admin UI path.** Delete the `contact_details` read from
   `src/features/admin/queries.ts` and the "Contact channels" block from
   `src/features/admin/components/users-tab.tsx`. The dossier keeps name, city,
   age, languages, interests, bio, and moderation history.
4. **Marketplace contact is not member PII.** `marketplace_products.
contact_information` (the seller phone) stays: it is product data an admin
   typed for the catalog, not a member's private channel.
5. **Audit and logs never contain either table's values** (ADR 0003).

Resulting access matrix:

| Reader                                      | `contact_details` | `profile_private` |
| ------------------------------------------- | ----------------- | ----------------- |
| Owner (`auth.uid() = profile_id`)           | ✅                | ✅                |
| Member with an accepted connection          | ✅                | ❌                |
| Admin / sub-admin (any capability)          | ❌                | ❌                |
| `service_role` (server, audited paths only) | ✅                | ✅                |
| `anon`                                      | ❌                | ❌                |

`service_role` keeps access because migrations, the purge job, and account
deletion need it; every server-side use must go through an audited action, and no
code path may return those values to a client.

## Consequences

- The admin review desk loses contact channels. That is intended: approving a
  persona is a content decision, not a reason to read a phone number.
- If support ever genuinely needs a channel, the answer is a **member-initiated**
  action (the member shares it in the appeal/support message), not an admin read.
- Removing the two policies changes the pgTAP expectations; tests must assert the
  deny for admins explicitly, otherwise the change can regress silently.
- `are_connected()` stays the single source of truth for "accepted connection";
  it is already `security definer` and used by the contact policy.

## Alternatives considered

- **A `pii.read` capability for a handful of admins**: rejected for now. It
  recreates the same exposure with extra steps, and nothing in the current
  workflows needs it. Revisit only with a documented support process.
- **Column-level masking (show last 4 digits)**: rejected — still leaks, and adds
  per-country formatting rules.
- **Removing `service_role` access entirely**: impossible without breaking
  migrations and the purge job; controlled by audit instead.

## Follow-ups

- Migration: `drop policy contact_details_select_admin`,
  `drop policy profile_private_select_admin`.
- Code: remove `contact_details` from `src/features/admin/queries.ts`; delete the
  contact block and its i18n keys from `users-tab.tsx`.
- pgTAP: admin selects on both tables return zero rows; accepted connection still
  reads `contact_details`; pending/declined do not.
- Docs: update the "Roles & states" and "Non-negotiable rules" sections in
  `docs/CONTEXT.md` with the "no admin PII" rule.
