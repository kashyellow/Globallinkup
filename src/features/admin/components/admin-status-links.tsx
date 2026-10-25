"use client";

import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export type AdminStatusOption = {
  value: string;
  label: string;
  count?: number;
};

export function AdminStatusLinks({
  basePath,
  current,
  options,
  query,
  extra,
  param = "status",
}: {
  basePath: string;
  current: string;
  options: readonly AdminStatusOption[];
  query?: string;
  extra?: Record<string, string>;
  param?: string;
}) {
  return (
    <div className="-mx-space-sm no-scrollbar flex items-center gap-1.5 overflow-x-auto px-space-sm pb-1">
      {options.map((option) => {
        const params = new URLSearchParams(extra);
        if (query) params.set("q", query);
        if (option.value !== "all") params.set(param, option.value);
        const href = params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
        const active = current === option.value;
        return (
          <Link
            key={option.value}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 font-label-md text-label-md whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
              active
                ? "bg-primary font-semibold text-on-primary"
                : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:text-on-surface",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
                  active ? "bg-on-primary/20 text-on-primary" : "bg-surface-container-highest",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
