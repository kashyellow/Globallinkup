"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * Holds the step-1 credentials while the user completes the persona. It lives
 * in the shared `(auth)` layout, so a client-side back/forward between
 * `/register` and `/create-persona` keeps the draft. It is deliberately
 * memory-only: a refresh sends the user back to step 1 instead of putting a
 * password in localStorage/sessionStorage.
 */
export type RegistrationDraft = {
  email: string;
  password: string;
  acceptedTerms: boolean;
};

type RegistrationDraftContextValue = {
  draft: RegistrationDraft | null;
  saveDraft: (draft: RegistrationDraft) => void;
  clearDraft: () => void;
};

const RegistrationDraftContext = createContext<RegistrationDraftContextValue | null>(null);

export function RegistrationDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<RegistrationDraft | null>(null);

  return (
    <RegistrationDraftContext.Provider
      value={{
        draft,
        saveDraft: setDraft,
        clearDraft: () => setDraft(null),
      }}
    >
      {children}
    </RegistrationDraftContext.Provider>
  );
}

export function useRegistrationDraft() {
  const value = useContext(RegistrationDraftContext);
  if (!value) {
    throw new Error("useRegistrationDraft must be used inside RegistrationDraftProvider");
  }
  return value;
}
