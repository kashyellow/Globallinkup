"use client";

import { useRef, useState } from "react";

/**
 * Synchronous in-flight guard plus render state.
 *
 * The ref is the actual gate: a second click that fires before React re-renders
 * still sees the key as busy. `pending` exists only so the button can show a
 * spinner/disabled state.
 */
export function usePendingAction() {
  const inFlight = useRef(new Set<string>());
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const isPending = (key = "default") => pending.has(key);

  async function run<T>(key: string, task: () => Promise<T>): Promise<T | undefined> {
    if (inFlight.current.has(key)) return undefined;

    inFlight.current.add(key);
    setPending(new Set(inFlight.current));

    try {
      return await task();
    } finally {
      inFlight.current.delete(key);
      setPending(new Set(inFlight.current));
    }
  }

  return { pending, isPending, run };
}
