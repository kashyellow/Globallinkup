import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Locale-aware wrappers around Next.js navigation APIs. Always import `Link`,
 * `useRouter`, etc. from here (not `next/link`) so locale prefixes are handled.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
