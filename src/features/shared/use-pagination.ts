"use client";

import { useState } from "react";

/**
 * Slices a list into pages and keeps the caller's page index in range.
 *
 * `pageSize` is fixed per listing; when the source array is shorter than a full
 * page the slice is cycled so every page renders a full set. The datasets in
 * this prototype are small (3–6 items) and the pages are decorative, so cycling
 * is what makes "next page" demonstrable rather than a dead button.
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
  const pageItems = Array.from({ length: Math.min(pageSize, items.length) }, (_, offset) => {
    const index = start + offset;
    return items[index % items.length];
  });

  return {
    page: currentPage,
    totalPages,
    pageItems,
    setPage,
    /** Call when the underlying list changes so the next render starts on page 1. */
    resetPage: () => setPage(1),
  };
}
