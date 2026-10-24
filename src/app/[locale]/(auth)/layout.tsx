import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RegistrationDraftProvider } from "@/features/auth/components/registration-draft-provider";

/**
 * Authentication/onboarding shell: brand + locale switch only, with a minimal
 * legal footer. Keeps sign-in/register/profile links off the pages where the
 * user is already in that flow.
 *
 * The draft provider wraps both step 1 (`/register`) and step 2
 * (`/create-persona`) so the in-memory credentials survive client-side
 * navigation. A full page unload intentionally clears them.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <RegistrationDraftProvider>
      <SiteHeader mode="content" />
      <main className="w-full grow bg-background pt-20">{children}</main>
      <SiteFooter variant="auth" />
    </RegistrationDraftProvider>
  );
}
