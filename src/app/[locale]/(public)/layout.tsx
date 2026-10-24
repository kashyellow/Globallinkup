import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

/** Public content shell for legal/resource pages. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader mode="content" />
      <main className="w-full grow bg-background pt-20">{children}</main>
      <SiteFooter variant="public" />
    </>
  );
}
