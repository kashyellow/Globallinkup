import type { ReactNode } from "react";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { MarketingHeader } from "@/components/layout/marketing-header";

/** Public marketing shell for the landing page. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    /*
     * `marketing-backdrop` supplies the page background, warm radial wash and
     * grain in one fixed, pointer-events-none layer, so no section has to carry
     * its own decoration and the grain never repaints during scroll.
     */
    <div className="marketing-backdrop flex min-h-[100dvh] w-full flex-1 flex-col">
      <MarketingHeader />
      <main className="w-full flex-1 pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}
