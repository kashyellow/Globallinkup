import type { AdminCapability } from "@/lib/admin-capabilities";

/**
 * A sub-admin gets any combination of desks. Each desk is a fixed bundle of the
 * capabilities from ADR 0002; the audit trail, settings and the team itself stay
 * owner-only, so no desk can ever include them.
 */
export type DeskAccess = { members: boolean; moderation: boolean; marketplace: boolean };

const MEMBERS_DESK: AdminCapability[] = ["members.review"];
const MODERATION_DESK: AdminCapability[] = [
  "posts.moderate",
  "comments.moderate",
  "reports.manage",
];
const MARKETPLACE_DESK: AdminCapability[] = ["marketplace.manage"];

export function deskCapabilities(access: DeskAccess): AdminCapability[] {
  return [
    ...(access.members ? MEMBERS_DESK : []),
    ...(access.moderation ? MODERATION_DESK : []),
    ...(access.marketplace ? MARKETPLACE_DESK : []),
  ];
}

/** The desks a capability list covers, whatever role it came from. */
export function accessFromCapabilities(capabilities: string[]): DeskAccess {
  return {
    members: capabilities.includes("members.review"),
    moderation: MODERATION_DESK.some((capability) => capabilities.includes(capability)),
    marketplace: capabilities.includes("marketplace.manage"),
  };
}

const DESK_NAMES = {
  members: "Members",
  moderation: "Moderation",
  marketplace: "Marketplace",
} as const;

/** One hidden role per combination of desks, e.g. `desk-members-marketplace`. */
export function deskRole(access: DeskAccess): { slug: string; name: string } | null {
  const desks = (Object.keys(DESK_NAMES) as (keyof DeskAccess)[]).filter((key) => access[key]);
  if (desks.length === 0) return null;
  return {
    slug: `desk-${desks.join("-")}`,
    name: desks.map((key) => DESK_NAMES[key]).join(" + "),
  };
}
