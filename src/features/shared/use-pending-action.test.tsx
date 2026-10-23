import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { usePendingAction } from "./use-pending-action";

describe("usePendingAction", () => {
  it("blocks a second call for the same key while the first is in flight", async () => {
    const { result } = renderHook(() => usePendingAction());

    let resolveFirst: (value: string) => void = () => {};
    const firstTask = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    let first: Promise<string | undefined> | undefined;
    act(() => {
      first = result.current.run("connect:1", () => firstTask);
    });

    expect(result.current.isPending("connect:1")).toBe(true);

    const second = await act(() => result.current.run("connect:1", async () => "second"));
    expect(second).toBeUndefined();

    await act(async () => {
      resolveFirst("first");
      await first;
    });

    expect(result.current.isPending("connect:1")).toBe(false);
  });

  it("allows different keys to run independently", async () => {
    const { result } = renderHook(() => usePendingAction());

    await act(async () => {
      const [a, b] = await Promise.all([
        result.current.run("a", async () => "a"),
        result.current.run("b", async () => "b"),
      ]);
      expect(a).toBe("a");
      expect(b).toBe("b");
    });
  });
});
