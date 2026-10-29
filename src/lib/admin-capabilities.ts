/**
 * Capabilities a role can hold (ADR 0002). Client-safe on purpose: the team
 * screen renders the checkbox matrix, while the server-only helpers in
 * `@/lib/admin` import from here.
 */
export const ADMIN_CAPABILITIES = [
  "members.review",
  "posts.moderate",
  "comments.moderate",
  "interests.review",
  "reports.manage",
  "marketplace.manage",
  "admins.manage",
  "settings.manage",
  "audit.read",
] as const;

export type AdminCapability = (typeof ADMIN_CAPABILITIES)[number];

export function isAdminCapability(value: string): value is AdminCapability {
  return (ADMIN_CAPABILITIES as readonly string[]).includes(value);
}
