"use client";

import { useTranslations } from "next-intl";

import { LinkPending } from "@/components/layout/link-pending";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export function AdminPagination({
  basePath,
  page,
  totalPages,
  query,
  status,
  extra,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  query?: string;
  status?: string;
  extra?: Record<string, string>;
}) {
  const t = useTranslations("Common.pagination");

  if (totalPages <= 1) return null;

  function href(target: number) {
    const params = new URLSearchParams(extra);
    if (query) params.set("q", query);
    if (status && status !== "all") params.set("status", status);
    if (target > 1) params.set("page", String(target));
    return params.size > 0 ? `${basePath}?${params.toString()}` : basePath;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="flex items-center justify-between gap-space-sm border-t border-outline-variant pt-space-lg">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "relative flex h-11 items-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg font-semibold transition-colors sm:px-4",
          page <= 1
            ? "pointer-events-none border border-outline-variant text-text-muted opacity-50"
            : "border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-container-high",
        )}
      >
        <LinkPending />
        <Icon name="arrow_back" className="text-base" />
        <span className="hidden sm:inline">{t("prevShort")}</span>
      </Link>

      <ol className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
        {pages.map((number) => (
          <li key={number}>
            <Link
              href={href(number)}
              aria-current={number === page ? "page" : undefined}
              className={cn(
                "relative flex h-11 w-11 items-center justify-center rounded-full font-label-lg text-label-lg tabular-nums transition-colors",
                number === page
                  ? "bg-primary font-semibold text-on-primary"
                  : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:text-on-surface",
              )}
            >
              <LinkPending />
              {number}
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href={href(page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          "relative flex h-11 items-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg font-semibold transition-colors sm:px-4",
          page >= totalPages
            ? "pointer-events-none border border-outline-variant text-text-muted opacity-50"
            : "bg-primary text-on-primary hover:bg-primary-hover",
        )}
      >
        <LinkPending />
        <span className="hidden sm:inline">{t("nextShort")}</span>
        <Icon name="arrow_forward" className="text-base" />
      </Link>
    </nav>
  );
}
