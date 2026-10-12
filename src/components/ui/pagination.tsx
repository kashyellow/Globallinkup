"use client";

import { useTranslations } from "next-intl";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const EASE = "ease-[cubic-bezier(0.32,0.72,0,1)]";

/**
 * Shared page stepper for the Discover, Posts and Marketplace listings.
 *
 * Rendered as Previous / page numbers / Next on a single pill row rather than a
 * centred number strip: the control belongs to the listing it terminates, so it
 * reads as the end of that list instead of a detached widget.
 *
 * A single page renders nothing at all — a lone disabled "1" is noise.
 */
export function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  className?: string;
}) {
  const t = useTranslations("Common.pagination");

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const atStart = page === 1;
  const atEnd = page === totalPages;

  const stepClass = cn(
    "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full px-3 font-label-lg text-label-lg font-semibold whitespace-nowrap transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:flex-none sm:px-4",
    EASE,
  );

  return (
    <nav
      aria-label={t("pageOf", { page, total: totalPages })}
      className={cn(
        "flex flex-wrap items-center justify-between gap-space-sm border-t border-outline-variant pt-space-lg",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={atStart}
        aria-label={t("previous")}
        className={cn(
          stepClass,
          atStart
            ? "cursor-not-allowed text-text-muted opacity-50"
            : "border border-outline-variant bg-surface-container text-on-surface hover:border-outline-hover hover:bg-surface-container-high active:translate-y-px",
        )}
      >
        <Icon name="arrow_back" className="text-base" />
        {/* Label shortens rather than wraps: "Previous" plus a number strip
            overflows a 360px row. */}
        <span className="hidden sm:inline">{t("prevShort")}</span>
        <span className="sm:hidden">{t("previous")}</span>
      </button>

      <ol className="flex items-center gap-1">
        {pages.map((number) => {
          const active = number === page;
          return (
            <li key={number}>
              <button
                type="button"
                onClick={() => onPageChange(number)}
                aria-label={t("goToPage", { page: number })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-full font-label-lg text-label-lg tabular-nums transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:translate-y-px",
                  EASE,
                  active
                    ? "bg-primary font-semibold text-on-primary"
                    : "border border-outline-variant bg-surface-container text-secondary hover:border-outline-hover hover:bg-surface-container-high hover:text-on-surface",
                )}
              >
                {number}
              </button>
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={atEnd}
        aria-label={t("next")}
        className={cn(
          stepClass,
          atEnd
            ? "cursor-not-allowed text-text-muted opacity-50"
            : "bg-primary text-on-primary hover:bg-primary-hover active:translate-y-px",
        )}
      >
        <span className="hidden sm:inline">{t("nextShort")}</span>
        <span className="sm:hidden">{t("next")}</span>
        <Icon name="arrow_forward" className="text-base" />
      </button>
    </nav>
  );
}
