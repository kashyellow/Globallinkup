import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";

/** Public marketing shell for the landing page. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <MarketingHeader />
      <main className="min-h-screen w-full flex-1 bg-[#121110] pt-20">{children}</main>
      <MarketingFooter />
    </>
  );
}
