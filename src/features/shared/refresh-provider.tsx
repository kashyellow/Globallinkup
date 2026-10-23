"use client";

import { createContext, useContext, useTransition, type ReactNode } from "react";

import { useRouter } from "@/lib/i18n/navigation";

type RefreshContextValue = {
  refresh: () => void;
  pending: boolean;
};

const RefreshContext = createContext<RefreshContextValue>({
  refresh: () => {},
  pending: false,
});

/**
 * Wraps `router.refresh()` in a transition so route/panel updates can show a
 * pending state. Without this the mutation button re-enables before fresh server
 * props arrive, inviting a second click.
 */
export function RefreshProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => router.refresh());
  }

  return (
    <RefreshContext.Provider value={{ refresh, pending }}>
      {pending ? (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
        >
          <div className="h-full w-1/3 animate-[refresh-slide_1.1s_ease-in-out_infinite] bg-primary motion-reduce:animate-none" />
        </div>
      ) : null}
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
