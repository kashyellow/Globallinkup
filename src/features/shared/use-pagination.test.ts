import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePagination } from "./use-pagination";

describe("usePagination", () => {
  it("does not repeat items to fill the last page", () => {
    const { result } = renderHook(() => usePagination([1, 2, 3, 4, 5], 4));

    expect(result.current.totalPages).toBe(2);
    expect(result.current.pageItems).toEqual([1, 2, 3, 4]);

    act(() => result.current.setPage(2));
    expect(result.current.pageItems).toEqual([5]);
  });

  it("keeps a short list on a single page", () => {
    const { result } = renderHook(() => usePagination([1, 2, 3], 4));
    expect(result.current.totalPages).toBe(1);
    expect(result.current.pageItems).toEqual([1, 2, 3]);
  });

  it("clamps a stale page when the list shrinks", () => {
    const { result, rerender } = renderHook(
      ({ items }: { items: number[] }) => usePagination(items, 2),
      { initialProps: { items: [1, 2, 3] } },
    );

    act(() => result.current.setPage(2));
    expect(result.current.pageItems).toEqual([3]);

    rerender({ items: [1] });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual([1]);
  });
});
