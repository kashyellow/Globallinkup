import type { ReactNode } from "react";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";

/** Signed-in application shell: fixed navbar + footer. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="min-h-[100dvh] w-full flex-1 bg-background pt-20">{children}</main>
      <Footer />
    </>
  );
}
