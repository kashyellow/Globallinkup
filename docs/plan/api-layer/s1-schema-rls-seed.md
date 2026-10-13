# S1 — Schema, RLS & seed

The database enforces the whole model **before any UI wiring**. Nothing
user-visible changes.

Back to [README](./README.md). Depends on **S0 ✅**.

- **Goal:** every table, constraint, RLS policy and seed row exists.
- **Gate:** `npm run db:reset` clean + RLS tests in `supabase/tests/` green, then
  `db:types` regenerates and `typecheck` / `build` stay green.

## 1. Migration — `supabase/migrations/<ts>_initial_schema.sql`

- **Enums** (PRD §6.1): `approval_status` (`pending|approved|rejected|suspended`),
  `app_role` (`user|admin`), `connection_status` (`requested|accepted|declined`),
  `moderation_status` (`visible|removed`), product `availability`, report
  `target_type` / `status`.
- **Tables** exactly as PRD §6.1:
  - `profiles` — 1:1 `auth.users`, PK = `auth.users.id` (ON DELETE CASCADE);
    `display_name`, `country_code`, `city`, `avatar_url`, `bio`, `interests
text[]`, `approval_status`, `role`, `submitted_at`, `reviewed_at`,
    `reviewed_by`, timestamps.
  - `contact_details` — separate 1:1 (so RLS can gate it), PK = `profile_id`.
  - `connections` — `requester_id`, `recipient_id`, `status`.
  - `posts` — `author_id`, `image_path`, `caption`, `moderation_status`,
    `removed_by`, `removed_at`.
  - `post_likes` — PK `(post_id, user_id)`.
  - `marketplace_products` — `price_cents` + `currency`, `category`,
    `availability`, `contact_information`, `is_published`, `created_by`.
  - `marketplace_product_images` — `product_id`, `storage_path`, `sort`.
  - `reports` — `reporter_id`, `target_type`, nullable `target_user_id` /
    `target_post_id`, `reason`, `details`, `status`, resolver audit.
- **Constraints:**
  - `connections`: `requester_id <> recipient_id`; unique unordered pair via an
    index on `(least(requester_id, recipient_id), greatest(...))`.
  - `reports`: exactly one of `target_user_id` / `target_post_id` is non-null,
    matching `target_type`.
  - `updated_at` trigger on every table.
- **RLS helper functions** (PRD §7.2) — `security definer`, `stable`, pinned
  `search_path`, `set search_path = ''`: `is_admin()`, `is_approved()`,
  `are_connected(a uuid, b uuid)`.
- **RLS enabled on every table** + policies per the PRD §7.3 matrix. Hard rules:
  `contact_details` readable only by owner / an accepted connection / admin;
  feed readable only by approved users; marketplace writes admin-only; reports
  readable by reporter / admin.
- **No signup trigger.** Per PRD §7.5 ("session, no profile → onboarding"), the
  `profiles` row is created on persona submit (S2/S3), not at `signUp` — so
  "no profile" keeps meaning "still onboarding".
- **Storage buckets defer to S4** (`avatars`, `post-images`, `product-images`).

## 2. Seed — `supabase/seed.sql` (LOCAL DEV ONLY)

Runs on `db reset` / `db seed` only (never `db push`). Marked loudly.

- A demo **admin** (`ADMIN_EMAIL`) and a couple of **approved** users with known
  passwords; pre-confirmed local accounts (bcrypt via `pgcrypto`, same pattern
  other projects use).
- Profiles mirroring today's mock personas (Sofia / Mateo / Camila / Lucas /
  Elena), a few posts + likes, marketplace products, and one accepted
  connection — so S3 can flip fixtures to real rows without inventing data.

## 3. RLS tests — `supabase/tests/` (`supabase test db`, pgTAP)

- anon cannot read `contact_details`;
- a `pending` user cannot read the feed;
- `contact_details` visible only to owner + accepted connection + admin;
- non-admin cannot insert/update `marketplace_products`;
- duplicate/ordered pair rejected by the connections constraint;
- a reporter cannot read another user's reports.

## 4. Open decisions

- **RLS tests:** pgTAP via `supabase test db` (PRD §9 intent) — confirm.
- **Seed admin:** the email/password for the local demo admin
  (e.g. `admin@globallinkup.test` / `password123`) — confirm.
