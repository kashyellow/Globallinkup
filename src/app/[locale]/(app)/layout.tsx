import type { ReactNode } from "react";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/**
 * Signed-in application shell: fixed navbar + footer, plus a mobile tab bar
 * below `lg`. The bottom bar overlays content, so `<main>` reserves ~5rem of
 * space for it on phones only — the same reserve the top pill needs via `pt-20`.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[100dvh] w-full flex-1 bg-background pt-20">{children}</main>
      {/*
       * The fixed mobile tab bar overlays whatever sits at the very bottom of
       * the page, so the reserve lives on the footer instead of `<main>` —
       * otherwise the bar floats on top of the footer's last row.
       */}
      <div className="pb-24 lg:pb-0">
        <Footer />
      </div>
      <BottomNav />
    </>
  );
}
