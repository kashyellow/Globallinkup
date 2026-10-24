import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/**
 * Authentication/onboarding shell: brand + locale switch only, with a minimal
 * legal footer. Keeps sign-in/register/profile links off the pages where the
 * user is already in that flow.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader mode="content" />
      <main className="w-full grow bg-background pt-20">{children}</main>
      <SiteFooter variant="auth" />
    </>
  );
}
