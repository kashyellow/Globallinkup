"use client";

import { useState } from "react";

/**
 * Slices a list into pages and keeps the caller's page index in range.
 *
 * The last page is allowed to be short: repeating items to fill it made page 2
 * of a 5-item list render page-1 cards again, which reads as duplicated data.
 *
 * Page state lives here rather than in the view so that a filter change can
 * reset it via `resetPage` in the same tick, without a `useEffect` (React
 * Compiler flags `setState` inside effects).
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // Guard against a stale page index when the item count shrinks.
  const currentPage = Math.min(page, totalPages);

  const start = (currentPage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return {
    page: currentPage,
    totalPages,
    pageItems,
    setPage,
    /** Call when the underlying list changes so the next render starts on page 1. */
    resetPage: () => setPage(1),
  };
}
