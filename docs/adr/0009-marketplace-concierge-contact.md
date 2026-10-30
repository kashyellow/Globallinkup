# ADR 0009 — Marketplace concierge contact is admin-editable

- **Status:** accepted
- **Date:** 2026-10-30
- **Related:** [ADR 0002](./0002-granular-admin-rbac.md) (capabilities),
  [ADR 0003](./0003-audit-log-and-pii.md) (audit metadata)

## Context

The curated marketplace is ordered through a human concierge, never a cart. The
channels live in `platform_settings` under the key `marketplace.contact`
(`supabase/seed.sql`), read by `getMarketplaceContact()`, and rendered by the
product dialog and the artisan-inquiry dialog.

Until now there was **no screen for it**. `settings.manage` gates the
`platform_settings_write_admin` policy, only the `owner` role holds that
capability by default, and the documented workflow was to edit the row in the
Supabase SQL editor. That is both error-prone and invisible to the marketplace
team who actually answers those inquiries.

`e8cb343` had also removed the phone number: `marketplace_products.contact_information`
(a per-product seller phone) and the global `whatsapp`/`whatsappLink` values.
Members were left with a single `mailto:` link, which opens whatever mail client
the browser has registered — often none on a desktop.

## Decision

1. **One concierge contact for the whole catalog**, not one per product:
   `platform_settings.marketplace.contact` holds `{ email, phone }`.
   `marketplace_products.contact_information` stays in the schema but is no
   longer read or written by the app.
2. **Edited from `/admin/marketplace`**, in a "Concierge contact" panel above the
   product list. The panel reads and writes the stored row directly, with no
   environment fallback, so operators always see what members see.
3. **Write access follows the desk.** The `platform_settings_write_admin` policy
   lets `settings.manage` write any row and `marketplace.manage` write only the
   `marketplace.contact` row. Reads keep using `platform_settings_select_approved`.
   This is the first deliberate carve-out from ADR 0002's one-capability-per-table
   matrix; a future capability such as `marketplace.contact` can replace it
   without a data migration.
4. **No seeded row in the cloud.** `db push` never runs `seed.sql`, so a deployed
   project starts unconfigured. The first admin save upserts the row.
5. **The public side degrades into a warning.** Each action renders only when its
   value is usable; when neither channel is configured the dialogs show a warning
   instead of a dead button.
6. **Derived links, one stored value.**
   - Email → Gmail's web composer
     (`mail.google.com/mail/?view=cm&fs=1&to=…&su=…`), with the address shown as
     text so it can be copied. `mailto:` is gone.
   - Phone → `tel:+<digits>` and `https://wa.me/<digits>?text=…`, both derived
     from the same number by `src/features/marketplace/contact.ts`. The number
     must include its country code (8–15 digits).

## Consequences

- The marketplace team can fix a wrong concierge address without a database
  client or an owner.
- `mailto:` no longer depends on a desktop mail handler, at the cost of requiring
  a Google session to send from Gmail. Copying the visible address is the escape
  hatch.
- Contact values never reach `audit_events`: the `settings.updated` row records
  the key and which fields changed (`changed.email`, `changed.phone` booleans),
  per ADR 0003.
- Empty state is a product state now: an unconfigured catalog is reachable and
  must stay honest rather than silently linking nowhere.

## Alternatives considered

- **Keep the env fallback** (`NEXT_PUBLIC_MARKETPLACE_EMAIL`): two sources of
  truth, and a deploy could quietly override what the admin just saved.
- **Per-product seller phone:** that is exactly what `e8cb343` removed; the
  catalog is concierge-fulfilled, so the number does not vary per piece.
- **Gate on `settings.manage` only:** correct by ADR 0002, but only the owner
  holds it, so the people answering inquiries still could not edit the values.
- **A new `marketplace.contact` capability:** cleaner long term, but it needs a
  role-matrix migration plus a UI change in `/admin/team` for one row. The key
  carve-out is the smaller step; splitting later needs no data migration.

## Follow-ups

- Migration `20261030130000_platform_settings_marketplace_contact.sql`.
- pgTAP `supabase/tests/marketplace_contact.test.sql` covers the carve-out.
- If a second marketplace-owned setting appears, promote the carve-out to a
  dedicated capability instead of widening the key list.
