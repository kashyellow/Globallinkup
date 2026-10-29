import type { ReactNode } from "react";

/**
 * Title block shared by the admin desks. On a phone it is the title, one short
 * meta line (a count) and an optional action on the same row; the explanatory
 * paragraph only shows from `md`, where there is room for it.
 */
export function AdminPageHeader({
  title,
  description,
  meta,
  action,
}: {
  title: string;
  description?: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-space-md">
      <div className="min-w-0">
        <h1 className="font-title text-title-mobile text-balance text-on-surface md:text-title">
          {title}
        </h1>
        {meta ? (
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{meta}</p>
        ) : null}
        {description ? (
          <p className="mt-2 hidden max-w-[62ch] font-body-md text-body-md text-on-surface-variant md:block">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
