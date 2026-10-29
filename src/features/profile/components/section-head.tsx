import type { ReactNode } from "react";

/**
 * Profile section header: the section's name on a full-width rule, with an
 * optional right-hand slot for state stamps. Shared by every profile section
 * so the rhythm stays identical down the page. Order is carried by position;
 * `index` is still accepted from callers but no longer printed.
 */
export function SectionHead({
  title,
  children,
}: {
  index?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant pb-space-sm">
      <h2 className="font-headline-sm text-headline-sm font-semibold text-on-surface">{title}</h2>
      {children}
    </div>
  );
}
