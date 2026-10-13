import type { ReactNode } from "react";

/**
 * Register section header.
 *
 * The dossier is typeset like a printed field register: every section opens
 * with an index numeral on a full-width rule, the title in caps micro-type,
 * and an optional right-hand slot for state stamps. Shared by all five
 * sections so the numbering rhythm stays identical down the page.
 */
export function SectionHead({
  index,
  title,
  children,
}: {
  index: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-space-sm border-b border-outline-variant pb-space-sm">
      <div className="flex items-baseline gap-space-sm">
        <span className="font-label-lg text-label-lg font-bold text-primary tabular-nums">
          {index}
        </span>
        <h2 className="font-label-lg text-label-lg font-bold tracking-[0.08em] text-on-surface uppercase">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}
