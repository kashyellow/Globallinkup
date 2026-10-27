# ADR 0002 — Granular admin roles and capabilities

- **Status:** proposed
- **Date:** 2026-10-27
- **Related:** [round 1, item 6](../feedback/2026-10-27-client-review.md),
  [ADR 0003 (audit)](./0003-audit-log-and-pii.md),
  [ADR 0005 (PII)](./0005-pii-access-boundaries.md)

## Context

`public.app_role` is `('user', 'admin')`, `public.is_admin()` is used by **23
policies** and referenced 54 times across the migrations, and the admin portal is
gated by `requireAdmin()` in `src/app/[locale]/(app)/admin/layout.tsx`. Every admin
can therefore do everything: review members, moderate posts and comments, approve
interests, manage the catalog, resolve reports, change settings.

The client wants a **sub-admin** limited to the marketplace and member
approval, and the first admin should be able to create more admins/sub-admins and
decide what each can do, per menu and feature.

The project previously listed sub-admin roles as out of scope
(`docs/CONTEXT.md`). This ADR moves them in scope.

## Decision

A role is a named set of capabilities. There is no role hierarchy and no
inheritance; a capability is either present or not.

### Schema

`public.admin_roles`

- `id uuid`, `slug text unique`, `name text`, `description text`
- `capabilities text[] not null default '{}'`
- `is_system boolean not null default false` — the `owner` role cannot be edited
  or emptied
- `created_at`, `updated_at`

`public.profiles.admin_role_id uuid references public.admin_roles (id)`

- `null` for members.
- `public.role` stays as-is (`'user' | 'admin'`) so existing reads and the
  `posts_protect_privileges` trigger keep working; `role = 'admin'` means "has an
  admin role", never "can do everything".

### Capabilities

| Capability           | Grants                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------ |
| `members.review`     | Read pending/approved dossiers, approve/reject/suspend members (without contact details, see ADR 0005) |
| `posts.moderate`     | Remove/restore posts, work the appeals desk                                                            |
| `comments.moderate`  | Remove/restore comments                                                                                |
| `interests.review`   | Approve/reject pending custom interests                                                                |
| `reports.manage`     | Read and resolve reports                                                                               |
| `marketplace.manage` | Create/update/publish/unpublish/trash/restore products and images                                      |
| `admins.manage`      | Create admin accounts, edit roles and capabilities, deactivate admins                                  |
| `settings.manage`    | Edit `platform_settings`                                                                               |
| `audit.read`         | Read `audit_events` (see ADR 0003)                                                                     |

Start with these nine, as agreed. Splitting further (for example
`marketplace.publish` separate from `marketplace.manage`) is a later round; the
model already allows it without a migration.

### Enforcement

- `public.has_capability(text)` — `security definer`, `stable`,
  `set search_path = ''`, reads `profiles.admin_role_id → admin_roles.capabilities`.
  Granted to `authenticated, service_role`.
- Every `public.is_admin()` inside an RLS policy is replaced by the narrowest
  capability for that domain:

| Policy area                                                                   | Capability           |
| ----------------------------------------------------------------------------- | -------------------- |
| `profiles_select_admin`, `profile_moderation_events`, review RPCs             | `members.review`     |
| `posts_select_visible` admin branch, `posts` update/delete, `posts_feed`      | `posts.moderate`     |
| `post_comments` admin branches                                                | `comments.moderate`  |
| `interest_catalog` review, `review_interest()`                                | `interests.review`   |
| `reports`                                                                     | `reports.manage`     |
| `marketplace_products`, `marketplace_product_images`, `product-images` bucket | `marketplace.manage` |
| `platform_settings`                                                           | `settings.manage`    |
| `audit_events`                                                                | `audit.read`         |
| `admin_roles` writes, admin account mutations                                 | `admins.manage`      |

- Server Actions: `requireAdminClient()` becomes
  `requireCapabilityClient(capability)`; every existing admin action passes its
  capability explicitly.
- UI: `AdminTabs` and the navbar link are filtered by capabilities; a direct URL
  to a desk without the capability returns `notFound()`/403 instead of an empty
  page.

### Guardrails

- The last account holding `admins.manage` (the `owner`) cannot be demoted,
  deactivated, or deleted.
- A role edit re-validates the actor's own capability; an admin cannot grant a
  capability they do not hold themselves.
- Every change to a role, account, or capability is audited with before/after
  capability sets.

### Creating accounts

Each admin has their own email and password. Two flows, and the choice is an
open question for the client:

1. **Invite (preferred long-term):** `auth.admin.inviteUserByEmail` → the person
   sets their own password via `/accept-invite`, which creates the minimal profile
   and assigns the role. Requires a working SMTP provider (Resend or similar).
2. **Generated password (works today):** the owner enters email + role; the
   server generates a password, shows it once, and the account signs in normally.
   It is the current `npm run admin:bootstrap -- --create` behaviour moved into
   the UI.

The CLI stays for the very first owner:
`npm run admin:bootstrap -- --create --email=… --role=owner`.

## Consequences

- 23 policies must change in one migration; a partial rewrite would either break
  the admin portal or silently widen access. The pgTAP suite is the gate.
- Admin queries that assume "admin sees everything" need review; some desks will
  legitimately lose rows.
- Role management becomes a product surface (new screens, tests, i18n) rather than
  a code change.
- Capability checks add one `security definer` call per policy evaluation; index
  `profiles.admin_role_id` and keep the function `stable` so Postgres can cache it
  per statement.

## Alternatives considered

- **Second enum value (`subadmin`)**: rejected — the client wants to configure
  permissions per feature, not two fixed tiers.
- **Per-user permission overrides**: rejected for now; roles keep the audit trail
  readable and avoid per-row drift. Add overrides later if a real need appears.
- **Inheritance/hierarchy**: rejected; nine flat capabilities are easier to reason
  about and to test.

## Follow-ups

- Migration: `admin_roles`, `profiles.admin_role_id`, `has_capability()`, seed the
  `owner` role, backfill the existing admin(s) to `owner`, rewrite the 23 policies.
- Server actions: `requireCapabilityClient`, capability argument per action.
- UI: role editor, admin account management, capability-filtered tabs/nav,
  403 handling.
- pgTAP: per-capability allow/deny matrix; last-owner guard; sub-admin cannot read
  contact details; RPCs reject missing capabilities.
- Docs: update `docs/CONTEXT.md` (sub-admin leaves "Out of scope").
